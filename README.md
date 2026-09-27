# 双休购 Cloudflare 全栈版

双休购已迁移为可部署到单个 Cloudflare Worker 的完整应用：React/Vite 前端由 Workers Static Assets 托管，Hono 提供 `/api/*`，D1 保存社区与互动数据，Workers KV 提供轻量文件存储验证接口。项目不使用 Cloudflare Pages、R2、VPS、Docker 或独立 Node.js 服务器。

候选厂商目录来自同级 `shuangxiu-index` 项目，共收录 1187 条厂商数据（100 条人工整理数据和 1087 条生成数据），但候选库不等于公开红榜。首页只展示人工筛选表中标记为“展示”的企业，并明确限定到用人主体、岗位、基地和核验时间；未入选仅表示资料或样本不足，不构成负面评价。2026-09-27 筛选结果共 27 家：16 家消费品牌、7 家上游供应商、4 家兼具品牌与供应商属性。

包含用户自由文本的推荐、资料更新和员工反馈均先进入 D1 审批队列；公众认可与消费支持只表达态度，不参与企业准入、可信度或双休兑现率计算。消费支持按 500 元阈值决定直接公开或进入审核。

网购透镜与讨论广场目前处于关闭状态：前端没有入口，`/api/community/*` 同时返回 404。源代码保留，待功能与审核策略完成后再显式开放。

## 架构与目录

```text
src/
├── frontend/          双休购 React 页面、组件和同源 API 客户端
│   └── vendor-data/   从 shuangxiu-index 复制的厂商与行业资料
└── worker/
    ├── db/            参数化 D1 查询
    ├── middleware/    API 安全响应头
    ├── routes/        健康检查、社区、互动、items、files 路由
    ├── services/      验证与统一错误
    ├── types/         Worker bindings 与数据类型
    └── index.ts       Hono Worker 入口
migrations/            D1 SQL migrations
public/                Static Assets 与安全头规则
wrangler.jsonc         Worker、D1、KV、Static Assets 配置
```

`/api/*` 优先交给 Worker；其他请求由 Static Assets 处理，并启用 SPA fallback。前端只请求 `/api/*` 相对地址，因此本地、`workers.dev` 和自定义域名使用同一套代码。

## 环境要求

- Node.js 20.19 或更高版本
- npm
- 首次创建或部署 Cloudflare 资源时需要 Cloudflare 账号
- 不需要全局安装 Wrangler；项目已把 Wrangler 固定为 devDependency

## 首次安装与 Cloudflare 资源配置

```bash
npm install
npm run cf:login
```

创建 D1 数据库：

```bash
npm run db:create
```

Wrangler 会返回真实的 `database_id`。把 `wrangler.jsonc` 中明确的占位符 `REPLACE_WITH_D1_DATABASE_ID` 替换为该 ID。不要填写示例 UUID，也不要提交不属于此项目的 ID。

创建 Workers KV namespace：

```bash
npm run kv:create
```

Wrangler 会返回真实的 KV namespace `id`。将 `wrangler.jsonc` 中的 `REPLACE_WITH_KV_NAMESPACE_ID` 替换为该 ID，不要伪造 ID。Worker 通过 `FILES` binding 访问 KV，不需要额外 Access Key。Workers KV 是最终一致性存储；本项目仅用它存放轻量文件，审批和统计等事务数据仍保存在 D1。

应用本地 D1 migration：

```bash
npm run db:migrate:local
```

本地 D1 与 KV 数据由 Wrangler 在 `.wrangler/` 下模拟和持久化，不会写入远程资源。

创建本地 secret 文件：

```bash
copy .dev.vars.example .dev.vars
```

将其中四个占位值替换为彼此独立、至少 32 字符的随机值：

- `ADMIN_API_TOKEN`：保护示例 Items CRUD 与 KV 文件接口。
- `MODERATION_ADMIN_TOKEN`：只用于审批后台，不能与其他 Token 共用。
- `ADMIN_ROUTE_KEY`：审批后台专用高熵 URL 路径段，只允许字母、数字、下划线和连字符。
- `ABUSE_HASH_SALT`：为来源网络标识生成不可逆摘要，用于限流和防重复提交。

`.dev.vars` 已被 Git 忽略，不能提交；示例文件不含真实 secret。修改 `.dev.vars` 后必须重启本地开发进程。

## 本地开发

```bash
npm run dev
```

Vite 会同时运行 React 和 Cloudflare Worker runtime，并提供本地 D1/KV bindings。打开终端显示的本地地址即可浏览厂商目录和提交待审内容。

常用 API 验证示例：

```bash
curl http://localhost:5173/api/health
curl http://localhost:5173/api/items -H "Authorization: Bearer <ADMIN_API_TOKEN>"
curl -X POST http://localhost:5173/api/items -H "Authorization: Bearer <ADMIN_API_TOKEN>" -H "Content-Type: application/json" -d '{"name":"First item","description":"D1 write test"}'
curl -X PUT http://localhost:5173/api/items/1 -H "Authorization: Bearer <ADMIN_API_TOKEN>" -H "Content-Type: application/json" -d '{"name":"Updated item","description":"D1 update test"}'
curl -X DELETE http://localhost:5173/api/items/1 -H "Authorization: Bearer <ADMIN_API_TOKEN>"

curl -X PUT http://localhost:5173/api/files/hello.txt -H "Authorization: Bearer <ADMIN_API_TOKEN>" -H "Content-Type: text/plain" -H "Content-Length: 8" --data-binary "hello KV"
curl http://localhost:5173/api/files/hello.txt -H "Authorization: Bearer <ADMIN_API_TOKEN>"
curl -X DELETE http://localhost:5173/api/files/hello.txt -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

PowerShell 中可使用 `curl.exe` 执行上述示例，避免 `curl` 别名的参数差异。

业务 API：

- `GET /api/stats`：消费承诺、推荐票和员工反馈聚合数据。
- `POST /api/submissions`：推荐企业或提交资料更新，内容只进入内部审批队列。
- `GET /api/submissions`：读取已经管理员批准的公开线索。
- `POST /api/brands/:id/votes`：提交公众认可；旧版反对票接口仅为数据兼容保留，红榜前端不提供入口，任何公众投票都不影响准入与兑现率。
- `POST /api/brands/:id/employee-reports`：提交匿名工作情况，返回 `202` 并进入审批队列。
- `POST /api/brands/:id/purchase-pledges`：提交消费打卡；金额为 1–500 元时直接计入公开总额，超过 500 元时进入审批队列。金额最多保留两位小数，上限为 1,000,000 元。
- `/api/community/*`：当前统一返回 404，讨论区未开放。

匿名滥用控制完全在 Worker 端完成：来源网络标识与 `ABUSE_HASH_SALT` 一起生成 SHA-256 摘要，原始地址不写入业务表。公众认可经过来源去重和限流后直接记录；企业推荐、资料更新、员工反馈以及超过 500 元的消费支持进入审批；500 元及以下消费支持直接记录。员工反馈限制同一企业/来源一条，消费支持限制同一企业/来源每天一次。它仍不等同于强身份认证；公开生产环境建议再启用 Cloudflare Rate Limiting 和 Turnstile。

Items CRUD 和 KV 文件接口要求 `Authorization: Bearer <ADMIN_API_TOKEN>`。文件上传必须提供与实际大小一致的 `Content-Length`，单个请求限制为 5 MiB；key 限制为 1–128 个安全字符（字母、数字、点、下划线、连字符），且拒绝 `..`。KV 保存文件内容与 `Content-Type`、字节数、SHA-256 ETag 元数据。

## 审批后台

审批后台没有公开入口，也没有固定的 `/admin` 路径。地址由运行时 Secret 组成：

```text
https://<worker-domain>/api/ops/<ADMIN_ROUTE_KEY>
```

### 进入方式

生产环境按以下步骤进入：

1. 从安全保存位置取得生产环境的 `ADMIN_ROUTE_KEY` 和 `MODERATION_ADMIN_TOKEN`。Cloudflare 已保存的 Secret 不能回显明文；如果原值遗失，需要在 Worker 的 **Settings → Variables & Secrets** 中重新设置，或在项目目录执行 `npx wrangler secret put <SECRET_NAME>` 轮换。
2. 在浏览器打开下面的地址，将最后一段替换成 `ADMIN_ROUTE_KEY` 的实际值，不要保留尖括号：

   ```text
   https://index.shuangxiugou.workers.dev/api/ops/<ADMIN_ROUTE_KEY>
   ```

3. 页面出现“**双休购审批后台**”后，在 Token 输入框中填写 `MODERATION_ADMIN_TOKEN`，点击“**验证并加载**”。这里不能填写 `ADMIN_API_TOKEN`，后者只保护 Items CRUD 和 KV 文件接口。
4. 登录后可在下拉框切换“待审批”“已通过”“已拒绝”；页面刷新后 Token 会从内存清除，需要重新输入。

本地开发时，先确认 `.dev.vars` 已填写上述两个值并运行 `npm run dev`，再打开：

```text
http://localhost:5173/api/ops/<ADMIN_ROUTE_KEY>
```

本地修改 `.dev.vars` 后必须重启开发进程。地址返回 404 通常表示 `ADMIN_ROUTE_KEY` 不正确；页面能打开但验证返回 401/403，通常表示 `MODERATION_ADMIN_TOKEN` 不正确。队列显示为空不代表登录失败，只表示当前筛选状态下没有记录。

打开准确地址后仍需通过独立的 `MODERATION_ADMIN_TOKEN` 验证，并受到来源网络速率限制。页面设置 `noindex`、`no-store`、严格 CSP、禁止 iframe，Token 只保存在当前页面 JavaScript 内存中，刷新即丢失。

后台可以查看待审、已批准和已拒绝记录。批准操作与公开表写入、审批状态更新和审计日志写入在同一 D1 batch 中完成：

- 企业投票直接进入公开聚合统计；员工反馈审核通过后公开；消费打卡按 500 元阈值决定直接公开或进入审核。
- 企业推荐和资料更新获批后只成为内部复核材料，不会自动进入红榜，也不会自动修改准入结论。
- 被拒绝内容不会进入任何公开查询。

不要把路径密钥或审批 Token 写入 Git、截图、书签同步、查询字符串或第三方密码表单。路径一旦出现在访问日志之外的非可信位置，应同时轮换 `ADMIN_ROUTE_KEY` 与 `MODERATION_ADMIN_TOKEN`。

## 红榜准入与双休兑现率

旧版 S/A/B/C 企业评级不再公开使用。红榜采用“两道门槛”：

- **公开资料试运行入选**：主体和适用范围清楚，至少存在可追溯的制度或行动依据；页面只陈述证据能支持的范围，不将集团、子公司、门店、外包岗位相互外推。若人工筛选仍决定展示存在反向线索的企业，页面必须显著标注“存在争议”并公开限制项，不能按无争议样本呈现。
- **员工执行已核验**：最近观察期内至少有 8 份通过审核的员工反馈，合计覆盖至少 24 个员工周，才公开双休兑现率。

双休兑现率按员工周计算：`休足两天的员工周 ÷ 全部有效观察员工周 × 100%`。同一份反馈同时记录岗位、基地、在离职状态、观察周数、休足两天周数、通常周工时、休息日被打断次数，以及加班费或补休是否兑现。小样本只显示“核验中”，不显示容易造成误读的百分比。

来源数量、公众投票和消费金额都不能直接抬高兑现率。公开资料用于准入与结论范围；结构化员工样本用于衡量执行；普通网友可认可企业，但不能替员工回答实际工时。出现重大冲突、证据过期或主体边界不清时，应暂停展示并重新核验。

## 检查、构建与预览

```bash
npm run typecheck
npm run build
npm run preview
```

Cloudflare Vite 插件会在 `dist/` 中生成客户端资源、Worker bundle 和部署用 Wrangler 输出配置。不需要 `nodejs_compat`，当前代码仅使用 Web/Workers Runtime API。

## 部署

先把 migration 应用到远程 D1，再部署 Worker：

```bash
npm run db:migrate:remote
npx wrangler secret put ADMIN_API_TOKEN
npx wrangler secret put MODERATION_ADMIN_TOKEN
npx wrangler secret put ADMIN_ROUTE_KEY
npx wrangler secret put ABUSE_HASH_SALT
npm run deploy
```

四个生产 secret 也可以在 Cloudflare Dashboard 的 **Settings → Variables & Secrets** 中创建；不要把值写进 `wrangler.jsonc`、GitHub Variables 或源码。缺少或长度不足时，受保护接口和公开写入接口会拒绝请求，而不是降级为无保护模式。

部署完成后 Wrangler 会输出 `https://index.<account-subdomain>.workers.dev` 形式的地址；当前账号的生产地址为 `https://index.shuangxiugou.workers.dev`。验证：

```bash
curl https://<worker-name>.<account-subdomain>.workers.dev/api/health
curl https://<worker-name>.<account-subdomain>.workers.dev/api/items -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

浏览器打开根地址，应显示红榜首页和当前通过准入的企业，不应直接展示 1187 条候选厂商目录。“网购透镜”和“讨论广场”当前不应出现在导航中，`/api/community/*` 也应返回 404。可使用上面的文件接口换成生产域名验证 KV。

## GitHub → Cloudflare Workers 自动部署

本项目适合直接放入 GitHub，不需要额外的 GitHub Actions：

1. 在 GitHub 创建仓库，将本目录提交并推送；建议生产分支为 `main`。
2. 在 Cloudflare Dashboard 打开 **Workers & Pages**，创建或选择 Worker，在 **Settings → Builds** 连接 GitHub 仓库并授权 Cloudflare Git integration。
3. Production branch 选择 `main`；Root directory 使用 `/`（如果项目位于 monorepo 子目录，则填写该子目录）。
4. Build command 填写 `npm run build`。
5. Deploy command 填写 `npx wrangler deploy`；非生产分支可保留默认 `npx wrangler versions upload` 以生成预览版本。
6. 确保 Dashboard 中 Worker 名称与 `wrangler.jsonc` 的 `name` 一致。

D1 与 KV bindings 来自版本库中的 `wrangler.jsonc`，因此真实 `database_id` 和 KV namespace `id` 必须在连接构建前配置正确。D1 migration 不应被普通应用部署隐式执行：首次发布或新增 migration 时，先由有权限的维护者显式运行 `npm run db:migrate:remote`，确认成功后再推送应用版本。

Workers Builds 会为连接的 Cloudflare 账号生成或使用构建 token。不要把 Cloudflare API Token 或其他凭据提交到 GitHub。本项目正常构建不需要把运行时 secret 暴露给构建环境；运行时 secret 在 **Settings → Variables & Secrets** 配置，或从可信终端执行：

```bash
npx wrangler secret put ADMIN_API_TOKEN
npx wrangler secret put MODERATION_ADMIN_TOKEN
npx wrangler secret put ADMIN_ROUTE_KEY
npx wrangler secret put ABUSE_HASH_SALT
```

本地运行时 secret 放在未跟踪的 `.dev.vars` 中，可复制 `.dev.vars.example` 后填写。`migrations/0004_moderation_queue.sql` 会创建统一审批队列和不可变审批日志，并移除 migration 0002 中附带的三个演示讨论帖。首次部署必须依次应用全部 migration。

`migrations/0005_public_stats_snapshot.sql` 会从现有消费、投票和员工反馈中生成一行公开统计快照，并创建三个 D1 触发器。此后业务表插入与快照更新处于同一数据库事务：任一步失败都会整体回滚；即使先执行 migration、稍后才由 GitHub 部署新版 Worker，过渡期间的写入也不会遗漏。`GET /api/stats` 因而始终只读取一行，不会随着历史互动记录增长而退化为全表扫描。

## 免费额度容量设计

当前首页静态文件由 Workers Static Assets 直接提供；每次首次打开主要产生 `/api/stats` 与 `/api/submissions` 两次动态请求。按每天 20,000 次独立访问估算：

- Worker 动态请求约 40,000 次/天，低于免费套餐 100,000 次/天；
- `/api/stats` 固定读取一行，约 20,000 行读取/天；
- `/api/submissions` 最多返回 100 行，即使完全不命中客户端或边缘缓存，也约 2,000,000 行读取/天；
- 两个公开 GET 都返回短时公开缓存策略，重复访问会进一步降低回源读取；
- 普通浏览、投票和消费不访问 KV，KV 仅供管理员文件验证接口使用。

建议将 20,000 日活作为免费套餐的正常运行目标，而不是硬上限。应在 Cloudflare Dashboard 中为 Worker 请求、D1 rows read、D1 rows written 设置用量告警；当动态请求长期超过 70,000/天、D1 读取超过 3,500,000 行/天或写入超过 70,000 行/天时，应先排查异常流量，再考虑进一步缓存或升级套餐。

## License

本项目采用 GNU General Public License v3.0（GPL-3.0-only）授权，完整条款见 [`LICENSE`](./LICENSE)。

## API 行为与安全约定

- D1 CRUD 全部使用 `prepare(...).bind(...)` 参数化 SQL。
- 非法 JSON、字段、ID、Content-Type 和 object key 返回统一 JSON 错误，不向客户端泄露 stack trace。
- 同源架构不启用 CORS，更不会设置 `Access-Control-Allow-Origin: *`。
- API 和静态资源都设置安全响应头；Vite 指纹资源使用长期 immutable cache。
- `GET /api/items` 最多返回最近 100 条记录，避免无界读取。
- 公开写接口只接受目录中存在的 1187 个企业 ID，未知 ID 返回 404，避免脏数据污染聚合结果。
- 讨论区每个主题最多返回 20 条最新回复，避免单次请求无界放大。
- 用户自由文本提交先进入统一审批队列；纯数值投票直接发布，消费打卡 500 元及以下直接发布、超过 500 元进入审批。所有入口仍执行来源去重、速率限制和参数化写入。
- 审批后台同时要求不可枚举的高熵路径和独立 Bearer Token，二者都缺失时 fail closed。
- 文本字段均做长度和类型校验，社区分页有固定上限；数据库写入均使用参数化语句。
- 员工内容明确标记为“匿名反馈（未经身份核验）”，避免把社区提交误述为已认证员工证言。
- 构建结束会主动移除 `dist` 中可能被 Static Assets 收集的 `.dev.vars*` 文件。
- KV namespace 只经 Worker binding 访问，不把管理 API Token 暴露给客户端。

## 日常 migration

创建下一条 migration：

```bash
npx wrangler d1 migrations create DB <migration-name>
```

先在本地应用并测试，再应用远程：

```bash
npm run db:migrate:local
npm run db:migrate:remote
```
