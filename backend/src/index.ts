import 'dotenv/config'; // 确保在顶部加载环境变量
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { connectDB } from './db';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { Context, DecodedToken } from './types'; // 我们将为上下文创建一个类型
import { verifyJWT } from './utils/auth';

dotenv.config();
const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGODB_URI || "mongodb://localhost:27017/llm_calendar_demo";

async function start() {
  // connect db
  await mongoose.connect(MONGO);
  console.log("MongoDB connected");

  // 2. 创建 Apollo Server 实例
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });

  // 3. 启动服务器并设置上下文
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: async ({ req }) => {
      // TODO: 实现完整的身份验证上下文逻辑
      // 1. 从请求头中获取 authorization
      const token = req.headers.authorization?.split(' ')[1] || '';
      
      try {
        // 2. 验证 JWT
        const decoded = verifyJWT(token);
        // 3. (模拟) 从数据库中查找用户
        if (decoded && typeof decoded !== 'string') {
           // 在真实应用中，你会用 decoded.userId 去数据库查用户
           // const user = await User.findById(decoded.userId);
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

  console.log(`?? 后端服务器已启动于: ${url}`);
}

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();
  server.applyMiddleware({ app, path: "/graphql", cors: false });

// (新增) 定义上下文类型
declare module './types' {
  interface Context {
    user: { _id: string; email: string; name: string } | null;
  }
  interface DecodedToken {
    userId: string;
  }
}