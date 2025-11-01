## 📁 项目结构

- `.env` — 存储秘密和环境变量 (本地)<br>
- `.env.example` — 环境变量示例文件<br>
- `.gitignore` — Git 忽略配置<br>
- `docker-compose.yml` — Docker 配置 (例如: 启动 MongoDB)<br>
- `package.json` — 根 package.json (用于 workspace 或 concurrently)<br>
- `README.md` — 项目文档 (你正在阅读的文件)<br>

---

### 🧠 Backend (`/backend`)
- `package.json`  
- `tsconfig.json`  
- `src/`  
  - `index.ts` — ✅ 服务器入口 (Apollo Server, DB 连接)<br>
  - `db.ts` — ✳️ (新增) MongoDB 连接逻辑<br>
  - `schema.ts` — ✅ GraphQL TypeDefs (类型定义)<br>
  - `resolvers.ts` — ✅ GraphQL Resolvers (业务逻辑)<br>
  - `agents/`  
    - `AIAgents.ts` — ✅ LLM 任务拆分逻辑<br>
  - `models/` — ✳️ (新增) Mongoose 数据模型  
    - `User.ts`  
    - `Task.ts`  
    - `CalendarEvent.ts`  
  - `utils/` — ✳️ (新增) 辅助工具 (例如: 认证)  
    - `auth.ts` — JWT, 密码哈希等  
  - `services/` — ✳️ (新增) 第三方 API 集成  
    - `googleCalendar.ts` — (可选) Google Calendar API 集成  
  - `scripts/` — ✳️ (新增) 存放一次性脚本  
    - `test-deepseek.ts` — (已移动) LLM 测试脚本  

---

### 💻 Frontend (`/frontend-react`)
- `package.json`  
- `vite.config.ts`  
- `index.html`  
- `src/`  
  - `main.tsx` — ✅ React 入口  
  - `App.tsx` — ✅ 顶级组件 (包含路由)  
  - `App.css` — 全局样式  
  - `router.tsx` — ✳️ (新增) React Router 路由配置  
  - `components/` — ✳️ (新增) 可重用 UI 组件  
    - `CalendarView.tsx`  
    - `TaskInput.tsx`  
    - `Login.tsx`  
    - `Navbar.tsx`  
  - `pages/` — ✳️ (新增) 页面级组件  
    - `HomePage.tsx`  
    - `LoginPage.tsx`  
    - `DashboardPage.tsx`  
  - `graphql/`  
    - `client.ts` — ✅ Apollo Client 初始化  
    - `queries.ts` — ✅ GraphQL 查询 (QUERY) 和变更 (MUTATION)  

---

如何运行 (开发环境)

先决条件

Node.js (v18+)

npm

Docker (和 Docker Compose)

1. 启动数据库 (MongoDB)

我们使用 Docker Compose 快速启动一个 MongoDB 实例。

docker-compose up -d mongo-db


(如果你想停止: docker-compose down)

2. 配置环境变量

复制 .env.example 为 .env，并确保 MONGODB_URI 和 JWT_SECRET 已配置。

cp .env.example .env


(打开 .env 文件并添加一个 JWT_SECRET)

3. 安装依赖

在项目根目录运行 npm install。这将会同时安装根目录、backend/ 和 frontend-react/ 的依赖。

npm install


4. 启动开发服务器

在项目根目录运行 dev 脚本，它将使用 concurrently 同时启动前端和后端。

npm run dev


🚀 后端 (Apollo GQL) 将运行在: http://localhost:4000

🎨 前端 (Vite React) 将运行在: http://localhost:5173 (或 Vite 提示的端口)

调试工作流程

打开 http://localhost:5173 访问前端。

打开 http://localhost:4000/graphql 访问 Apollo GQL 操作台 (Playground)，你可以在这里独立测试后端的 login 和 splitTask 变更。

前端登录 (使用模拟值 user@example.com / 123456)，你将被重定向到 /dashboard。

在仪表盘中，输入任务（例如 "下周完成报告"）并点击 "AI 智能拆分"。

检查浏览器控制台和 Node.js 终端的 console.log，查看模拟的数据流和 TODO 标记。