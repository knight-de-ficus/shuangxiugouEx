import { Hono } from "hono";
import { ApiError } from "../services/errors";
import { enumField, requireRecord, stringField } from "../services/community-validation";
import { parseJsonBody } from "../services/validation";
import { decideModeration, listModerationQueue } from "../services/moderation";
import { enforceRateLimit, requireAdminRoute, requireModerationAdmin } from "../services/security-controls";
import type { AppEnv } from "../types/bindings";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("/:routeKey/*", async (context, next) => {
  await requireAdminRoute(context, context.req.param("routeKey"));
  await next();
});

adminRoutes.get("/:routeKey", async (context) => {
  await requireAdminRoute(context, context.req.param("routeKey"));
  await enforceRateLimit(context, "admin-page", 30, 3600);
  const nonceBytes = crypto.getRandomValues(new Uint8Array(18));
  const nonce = Array.from(nonceBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const routeKeyLiteral = JSON.stringify(context.req.param("routeKey"));
  context.header("Content-Type", "text/html; charset=utf-8");
  context.header("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  context.header(
    "Content-Security-Policy",
    `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
  );
  return context.body(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
  <title>双休购 · 审批后台</title>
  <style nonce="${nonce}">
    :root{font-family:Inter,"Microsoft YaHei",sans-serif;color:#18212f;background:#f5f2ef}*{box-sizing:border-box}
    body{margin:0}.shell{max-width:1120px;margin:0 auto;padding:28px 18px 64px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}
    h1{font-size:22px;margin:0}.muted{color:#64748b;font-size:13px}.panel{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;box-shadow:0 8px 30px rgba(15,23,42,.06)}
    .auth{display:grid;grid-template-columns:1fr auto;gap:10px}.toolbar{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.toolbar select,.toolbar input{width:auto}
    input,select,textarea,button{font:inherit}input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:10px;background:#fff}textarea{min-height:72px;resize:vertical}
    button{border:0;border-radius:9px;padding:10px 14px;font-weight:700;cursor:pointer}.primary{background:#b91c1c;color:#fff}.secondary{background:#e2e8f0;color:#1e293b}.danger{background:#0f172a;color:#fff}button:disabled{opacity:.45;cursor:not-allowed}
    .cards{display:grid;gap:12px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:15px}.head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.tag{font:700 12px ui-monospace,monospace;color:#991b1b;background:#fee2e2;padding:4px 7px;border-radius:6px}.payload{white-space:pre-wrap;word-break:break-word;background:#f8fafc;border-radius:9px;padding:10px;font:12px/1.55 ui-monospace,monospace;margin:12px 0}.actions{display:flex;gap:8px;justify-content:flex-end}.empty{text-align:center;padding:48px 12px;color:#64748b}.error{color:#b91c1c;font-weight:700}.ok{color:#166534;font-weight:700}
    @media(max-width:640px){.auth{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}.actions{justify-content:stretch}.actions button{flex:1}}
  </style>
</head>
<body>
  <main class="shell">
    <div class="top"><div><h1>双休购审批后台</h1><div class="muted">路径密钥与管理员 Token 双重验证 · Token 仅保存在当前页面内存</div></div><div id="summary" class="muted">尚未认证</div></div>
    <section class="panel">
      <div class="auth"><input id="token" type="password" autocomplete="off" placeholder="输入 ADMIN_API_TOKEN"><button id="login" class="primary">验证并加载</button></div>
      <div class="toolbar"><select id="status"><option value="pending">待审批</option><option value="approved">已通过</option><option value="rejected">已拒绝</option></select><button id="refresh" class="secondary" disabled>刷新</button><span id="message" class="muted"></span></div>
      <div id="queue" class="cards"><div class="empty">输入管理员 Token 后加载审批队列。</div></div>
    </section>
  </main>
  <script nonce="${nonce}">
    (() => {
      'use strict';
      const routeKey = ${routeKeyLiteral};
      const base = '/api/ops/' + encodeURIComponent(routeKey);
      const tokenInput = document.getElementById('token');
      const loginButton = document.getElementById('login');
      const refreshButton = document.getElementById('refresh');
      const statusSelect = document.getElementById('status');
      const queue = document.getElementById('queue');
      const message = document.getElementById('message');
      const summary = document.getElementById('summary');
      let token = '';

      const setMessage = (text, kind = '') => { message.textContent = text; message.className = kind || 'muted'; };
      const api = async (path, init = {}) => {
        const response = await fetch(base + path, { ...init, headers: { Accept: 'application/json', Authorization: 'Bearer ' + token, ...(init.body ? {'Content-Type':'application/json'} : {}) } });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error?.message || 'HTTP ' + response.status);
        return body;
      };
      const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
      const load = async () => {
        setMessage('加载中…');
        refreshButton.disabled = true;
        try {
          const data = await api('/queue?status=' + encodeURIComponent(statusSelect.value));
          queue.replaceChildren();
          summary.textContent = '当前 ' + data.entries.length + ' 条';
          if (!data.entries.length) queue.append(element('div', 'empty', '当前队列为空。'));
          for (const entry of data.entries) {
            const card = element('article', 'card');
            const head = element('div', 'head');
            const title = element('div');
            title.append(element('span', 'tag', entry.submission_type), element('div', 'muted', entry.created_at + ' · ' + entry.target_key));
            head.append(title, element('strong', '', entry.status));
            card.append(head, element('div', 'payload', JSON.stringify(entry.payload, null, 2)));
            if (entry.status === 'pending') {
              const note = element('textarea'); note.placeholder = '审批说明（可选，最多 1000 字）';
              const actions = element('div', 'actions');
              const reject = element('button', 'danger', '拒绝');
              const approve = element('button', 'primary', '批准并公开');
              const decide = async (decision) => {
                reject.disabled = true; approve.disabled = true; setMessage('提交审批决定…');
                try { await api('/queue/' + encodeURIComponent(entry.id) + '/decision', { method:'POST', body: JSON.stringify({ decision, note: note.value }) }); setMessage('审批完成。', 'ok'); await load(); }
                catch (error) { setMessage(error.message, 'error'); reject.disabled = false; approve.disabled = false; }
              };
              reject.addEventListener('click', () => decide('rejected'));
              approve.addEventListener('click', () => decide('approved'));
              actions.append(reject, approve); card.append(note, actions);
            } else if (entry.reviewer_note) card.append(element('div', 'muted', '审批说明：' + entry.reviewer_note));
            queue.append(card);
          }
          setMessage('已加载。', 'ok');
        } catch (error) { queue.replaceChildren(element('div', 'empty error', error.message)); setMessage(error.message, 'error'); }
        finally { refreshButton.disabled = !token; }
      };
      loginButton.addEventListener('click', () => { token = tokenInput.value; tokenInput.value = ''; if (!token) return setMessage('请输入 Token。', 'error'); refreshButton.disabled = false; load(); });
      refreshButton.addEventListener('click', load);
      statusSelect.addEventListener('change', () => { if (token) load(); });
      tokenInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') loginButton.click(); });
    })();
  </script>
</body>
</html>`);
});

adminRoutes.use("/:routeKey/queue*", async (context, next) => {
  await enforceRateLimit(context, "admin-api", 120, 3600);
  await requireModerationAdmin(context);
  await next();
});

adminRoutes.get("/:routeKey/queue", async (context) => {
  const rawStatus = context.req.query("status") ?? "pending";
  const status = enumField({ status: rawStatus }, "status", ["pending", "approved", "rejected"] as const);
  const entries = await listModerationQueue(context.env.DB, status);
  return context.json({ entries });
});

adminRoutes.post("/:routeKey/queue/:id/decision", async (context) => {
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const decision = enumField(body, "decision", ["approved", "rejected"] as const);
  const note = stringField(body, "note", 0, 1000, true);
  const result = await decideModeration(context, context.req.param("id"), decision, note);
  return context.json({ result });
});

adminRoutes.all("/:routeKey/*", () => {
  throw new ApiError(404, "not_found", "API route not found.");
});
