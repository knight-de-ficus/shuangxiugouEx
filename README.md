# Cloudflare Full Stack Environment

一个部署到单个 Cloudflare Worker 的最小全栈模板：React/Vite 前端由 Workers Static Assets 托管，Hono 提供 `/api/*`，D1 保存结构化数据，R2 保存文件。项目不使用 Cloudflare Pages、VPS、Docker 或独立 Node.js 服务器。

## 架构与目录

```text
src/
├── frontend/          React 页面、组件和同源 API 客户端
└── worker/
    ├── db/            参数化 D1 查询
    ├── middleware/    API 安全响应头
    ├── routes/        health、items、files 路由
    ├── services/      验证与统一错误
    ├── types/         Worker bindings 与数据类型
    └── index.ts       Hono Worker 入口
migrations/            D1 SQL migrations
public/                Static Assets 与安全头规则
wrangler.jsonc         Worker、D1、R2、Static Assets 配置
```

`/api/*` 优先交给 Worker；其他请求由 Static Assets 处理，并启用 SPA fallback。前端只请求相对地址 `/api/health`，因此本地、`workers.dev` 和自定义域名使用同一套代码。

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

创建与配置同名 R2 bucket：

```bash
npm run r2:create
```

默认名称是 `shuangxiugou-files`，与 `wrangler.jsonc` 的 `bucket_name` 一致。如需改名，应同时修改命令与配置。Worker 通过 `BUCKET` binding 直接访问私有 bucket，不需要也不应创建 R2 Access Key。

应用本地 D1 migration：

```bash
npm run db:migrate:local
```

本地 D1 与 R2 数据由 Wrangler 在 `.wrangler/` 下模拟和持久化，不会写入远程资源。

## 本地开发

```bash
npm run dev
```

Vite 会同时运行 React 和 Cloudflare Worker runtime，并提供本地 D1/R2 bindings。打开终端显示的本地地址；主页会自动调用 `/api/health`。

常用 API 验证示例：

```bash
curl http://localhost:5173/api/health
curl http://localhost:5173/api/items
curl -X POST http://localhost:5173/api/items -H "Content-Type: application/json" -d '{"name":"First item","description":"D1 write test"}'
curl -X PUT http://localhost:5173/api/items/1 -H "Content-Type: application/json" -d '{"name":"Updated item","description":"D1 update test"}'
curl -X DELETE http://localhost:5173/api/items/1

curl -X PUT http://localhost:5173/api/files/hello.txt -H "Content-Type: text/plain" --data-binary "hello R2"
curl http://localhost:5173/api/files/hello.txt
curl -X DELETE http://localhost:5173/api/files/hello.txt
```

文件示例接口限制单个请求为 5 MiB，key 限制为 1–128 个安全字符（字母、数字、点、下划线、连字符），且拒绝 `..`。这是基础验证接口，不是公开匿名上传系统；生产业务应再添加认证、速率限制、配额和内容策略。

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
npm run deploy
```

部署完成后 Wrangler 会输出类似 `https://shuangxiugou-fullstack.<account-subdomain>.workers.dev` 的地址。验证：

```bash
curl https://<worker-name>.<account-subdomain>.workers.dev/api/health
curl https://<worker-name>.<account-subdomain>.workers.dev/api/items
```

浏览器打开根地址，应显示前端、Backend API 和 D1 Database 均为 `OK`。R2 可使用上面的文件接口换成生产域名验证。

## GitHub → Cloudflare Workers 自动部署

本项目适合直接放入 GitHub，不需要额外的 GitHub Actions：

1. 在 GitHub 创建仓库，将本目录提交并推送；建议生产分支为 `main`。
2. 在 Cloudflare Dashboard 打开 **Workers & Pages**，创建或选择 Worker，在 **Settings → Builds** 连接 GitHub 仓库并授权 Cloudflare Git integration。
3. Production branch 选择 `main`；Root directory 使用 `/`（如果项目位于 monorepo 子目录，则填写该子目录）。
4. Build command 填写 `npm run build`。
5. Deploy command 填写 `npx wrangler deploy`；非生产分支可保留默认 `npx wrangler versions upload` 以生成预览版本。
6. 确保 Dashboard 中 Worker 名称与 `wrangler.jsonc` 的 `name` 一致。

D1 与 R2 bindings 来自版本库中的 `wrangler.jsonc`，因此真实 `database_id` 和 bucket 名称必须在连接构建前配置正确。D1 migration 不应被普通应用部署隐式执行：首次发布或新增 migration 时，先由有权限的维护者显式运行 `npm run db:migrate:remote`，确认成功后再推送应用版本。

Workers Builds 会为连接的 Cloudflare 账号生成或使用构建 token。不要把 Cloudflare API Token、R2 Access Key 或其他凭据提交到 GitHub。构建期变量在 **Settings → Builds** 配置；运行时 secret 在 **Settings → Variables & Secrets** 配置，或从可信终端执行：

```bash
npx wrangler secret put SECRET_NAME
```

本地运行时 secret 放在未跟踪的 `.dev.vars` 中，可复制 `.dev.vars.example` 后填写。当前模板不需要任何 secret。

## License

本项目采用 GNU General Public License v3.0（GPL-3.0-only）授权，完整条款见 [`LICENSE`](./LICENSE)。

## API 行为与安全约定

- D1 CRUD 全部使用 `prepare(...).bind(...)` 参数化 SQL。
- 非法 JSON、字段、ID、Content-Type 和 object key 返回统一 JSON 错误，不向客户端泄露 stack trace。
- 同源架构不启用 CORS，更不会设置 `Access-Control-Allow-Origin: *`。
- API 和静态资源都设置安全响应头；Vite 指纹资源使用长期 immutable cache。
- `GET /api/items` 最多返回最近 100 条记录，避免无界读取。
- R2 bucket 保持私有，只能经 Worker binding 访问。

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
