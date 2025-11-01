项目文件结构本项目采用 monorepo 结构，包含 backend (Node.js/GraphQL) 和 frontend-react (React/Vite) 两个核心目录。.
|-- .env                  # 存储秘密和环境变量 (本地)
|-- .env.example          # 环境变量示例文件
|-- .gitignore            # Git 忽略配置
|-- docker-compose.yml    # Docker 配置 (例如: 启动 MongoDB)
|-- package.json          # 根 package.json (用于 workspace 或 concurrently)
|-- README.md             # 项目文档
|-- backend/              # 后端 Node.js 项目
|   |-- package.json
|   |-- tsconfig.json
|   |-- src/
|       |-- index.ts          # ✅ 服务器入口 (Apollo Server, DB 连接)
|       |-- db.ts             # ✳️ (新增) MongoDB 连接逻辑
|       |-- schema.ts         # ✅ GraphQL TypeDefs (类型定义)
|       |-- resolvers.ts      # ✅ GraphQL Resolvers (业务逻辑)
|       |-- agents/
|       |   |-- AIAgents.ts   # ✅ LLM 任务拆分逻辑
|       |-- models/           # ✳️ (新增) Mongoose 数据模型
|       |   |-- User.ts
|       |   |-- Task.ts
|       |   |-- CalendarEvent.ts
|       |-- utils/            # ✳️ (新增) 辅助工具 (例如: 认证)
|       |   |-- auth.ts       # JWT, 密码哈希等
|       |-- services/         # ✳️ (新增) 用于集成第三方 API
|       |   |-- googleCalendar.ts # (可选) Google Calendar API 集成
|       |-- scripts/          # ✳️ (新增) 存放一次性脚本
|           |-- test-deepseek.ts # (已移动) LLM 测试脚本
|
|-- frontend-react/       # 前端 React 项目
    |-- package.json
    |-- vite.config.ts
    |-- index.html
    |-- src/
        |-- main.tsx          # ✅ React 入口
        |-- App.tsx           # ✅ 顶级组件 (包含路由)
        |-- App.css           # 全局样式
        |-- router.tsx        # ✳️ (新增) React Router 路由配置
        |-- components/       # ✳️ (新增) 可重用UI组件
        |   |-- CalendarView.tsx
        |   |-- TaskInput.tsx
        |   |-- Login.tsx
        |   |-- Navbar.tsx
        |-- pages/            # ✳️ (新增) 页面级组件
        |   |-- HomePage.tsx
        |   |-- LoginPage.tsx
        |   |-- DashboardPage.tsx
        |-- graphql/
            |-- client.ts     # ✅ Apollo Client 初始化
            |-- queries.ts    # ✅ GraphQL 查询 (QUERY) 和变更 (MUTATION)

图例✅: 从原始结构中保留的核心文件。✳️: 基于分析新增或重构的结构。frontend/ 目录已被移除，以 frontend-react/ 为准。backend/ 中与游戏（Game）相关的文件已被移除。