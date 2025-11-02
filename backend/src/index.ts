import 'dotenv/config'; 
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { connectDB } from './db';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { Context, DecodedToken } from './types';
import { verifyJWT } from './utils/auth';

dotenv.config();
const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGODB_URI || "mongodb://localhost:27017/llm_calendar_demo";

async function start() {
  // connect db
  await mongoose.connect(MONGO);
  console.log("MongoDB connected");

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: async ({ req }) => {

      const token = req.headers.authorization?.split(' ')[1] || '';
      
      try {
        const decoded = verifyJWT(token);
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

  console.log(`?? ��˷�������������: ${url}`);
}

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();
  server.applyMiddleware({ app, path: "/graphql", cors: false });

declare module './types' {
  interface Context {
    user: { _id: string; email: string; name: string } | null;
  }
  interface DecodedToken {
    userId: string;
  }
}