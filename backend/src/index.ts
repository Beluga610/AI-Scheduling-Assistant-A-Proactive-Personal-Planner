// backend/src/index.ts
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件（在根目录）
const envPath = join(__dirname, '..', '..', '.env');
console.log('📂 加载 .env 文件:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ 加载 .env 失败:', result.error);
} else {
  console.log('✅ .env 文件加载成功');
}

// 检查环境变量
console.log('🔑 DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '✅ 已设置' : '❌ 未设置');
console.log('🔧 PORT:', process.env.PORT || '4000 (默认)');

if (!process.env.DEEPSEEK_API_KEY) {
  console.error('\n❌ 错误: DEEPSEEK_API_KEY 未设置');
  console.error('💡 请确认 .env 文件存在:', envPath);
  process.exit(1);
}

// 导入其他模块
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { GameOrchestrator } from './agents/GameOrchestrator.js';
import { AIAgent } from './agents/AIAgents.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // 测试 DeepSeek API 连接
  console.log('\n' + '='.repeat(60));
  console.log('🧪 测试 DeepSeek API 连接...');
  await AIAgent.testConnection();
  console.log('='.repeat(60) + '\n');

  // 初始化游戏编排器
  const gameOrchestrator = new GameOrchestrator();

  // 创建 Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // 中间件
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    }),
    express.json(),
    expressMiddleware(server, {
      context: async () => ({
        gameOrchestrator,
      }),
    })
  );

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  
  console.log(`\n🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 GraphQL Playground: http://localhost:${PORT}/graphql\n`);
}

startServer().catch((error) => {
  console.error('\n❌ Failed to start server:', error);
  process.exit(1);
});