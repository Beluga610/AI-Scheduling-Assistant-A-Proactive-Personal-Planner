import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import mongoose from 'mongoose';

// ADD .js TO ALL LOCAL IMPORTS
import User from "./models/User.js";
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { Context, DecodedToken } from './types.js';
import { verifyToken } from './utils/auth.js';

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
    listen: { port: Number(PORT), host: '0.0.0.0' },
    context: async ({ req }) => {
      const token = req.headers.authorization?.split(' ')[1] || '';
      console.log("[Context] Received token:", token ? "Yes" : "No"); // 日志4
      
      try {
        const decoded = verifyToken(token);

        if (decoded && typeof decoded !== 'string' && (decoded as DecodedToken).userId) {
          const user = await User.findById((decoded as DecodedToken).userId);
          
          if (user && user.email) {
            const userForContext = {
              _id: user._id.toString(),
              email: user.email,   
              name: user.name || "Unnamed User",   
            };

          console.log("[Context] User found, returning context:", { user: userForContext }); // 日志5
          return { user: userForContext };
        }
      }
        console.warn("[Context] No valid user, returning null."); // 日志6
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