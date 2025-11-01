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

### 🧩 说明
- **✅** 表示核心功能模块  
- **✳️ (新增)** 表示你在本次版本中新增或优化的结构  
- 后端采用 **Node.js + GraphQL (Apollo Server)**  
- 前端基于 **React + Vite + Apollo Client**  
- 使用 **Docker Compose** 管理 MongoDB 启动与环境配置  