import 'dotenv/config'; // 确保在顶部加载环境变量
// (修改) 导入 apollo-server v2
import { ApolloServer } from 'apollo-server';
// (修改) 移除 @apollo/server/standalone
import { connectDB } from './db';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { Context, DecodedToken } from './types'; // 我们将为上下文创建一个类型
import { verifyJWT } from './utils/auth';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

async function startApolloServer() {
  // 1. 连接数据库
  await connectDB();

  // 2. 创建 Apollo Server 实例 (v2 语法)
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // (修改) context 现在是 v2 构造函数的一部分
    context: async ({ req }) => {
      // TODO: 实现完整的身份验证上下文逻辑
      
      // 1. 从请求头中获取 authorization (Node 10 兼容)
      const authorizationHeader = req.headers.authorization || '';
      const token = (authorizationHeader && authorizationHeader.split(' ')[1]) || '';
      
      try {
        // 2. 验证 JWT
        const decoded = verifyJWT(token);
        // 3. (模拟) 从数据库中查找用户
        if (decoded && typeof decoded !== 'string') {
           const mockUser = { _id: (decoded as DecodedToken).userId, email: "mock@user.com", name: "Mock User" };
           return { user: mockUser };
        }
        return { user: null };
      } catch (error) {
        // console.error('Context auth error:', error.message);
        return { user: null };
      }
    },
  });

  // 3. 启动服务器 (v2 语法)
  const { url } = await server.listen({ port: PORT });

  console.log(`🚀 后端服务器已启动于: ${url}`);
}

startApolloServer().catch(error => {
  console.error('启动服务器失败:', error);
});

// (新增) 定义上下文类型
declare module './types' {
  interface Context {
    user: { _id: string; email: string; name: string } | null;
  }
  interface DecodedToken {
    userId: string;
  }
}

