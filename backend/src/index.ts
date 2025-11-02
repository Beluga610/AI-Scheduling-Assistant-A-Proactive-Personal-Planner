import 'dotenv/config'; 
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import mongoose from 'mongoose'; // 需要导入 mongoose
import User from "../models/User";
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { Context, DecodedToken } from './types';
import { verifyToken } from './utils/auth';

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/llm_calendar";

const initialUsers = [
  { name: "yining", email: "yining@admin.com" },
  { name: "lijun", email: "lijun@admin.com" },
  { name: "yizhuo", email: "yizhuo@admin.com" },
];

async function initAdmins() {
  for (const u of initialUsers) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      const user = new User(u);
      await user.save();
      console.log(`Created initial user: ${u.name}`);
    } else {
      console.log(`User already exists: ${u.name}`);
    }
  }
}

async function start() {
  // connect db
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");
  await initAdmins();

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(PORT) },
    context: async ({ req }) => {
      const token = req.headers.authorization?.split(' ')[1] || '';
      
      try {
        const decoded = verifyToken(token);
        if (decoded && typeof decoded !== 'string') {
          const mockUser = { 
            _id: (decoded as DecodedToken).userId, 
            email: "mock@user.com", 
            name: "Mock User" 
          };
          return { user: mockUser };
        }
        return { user: null };
      } catch (error) {
        console.error('Context auth error:', error);
        return { user: null };
      }
    },
  });

  console.log(`🚀 Server ready at: ${url}`);
}

// 启动服务器
start().catch(console.error);