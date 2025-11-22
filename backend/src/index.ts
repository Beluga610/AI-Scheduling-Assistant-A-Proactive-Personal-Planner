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

/**
 * Initializes default admin users if they do not exist.
 * This ensures the system is seeded with necessary data for testing and demo purposes.
 */
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

/**
 * Bootstraps the application:
 * 1. Connects to MongoDB with error handling.
 * 2. Sets up Apollo Server for GraphQL.
 * 3. Configures the Context Middleware to handle JWT authentication for every request.
 */
async function start() {
  // 1. Connect to Database
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");
  await initAdmins();

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });

  // 2. Start Server with Context Middleware
  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(PORT), host: '0.0.0.0' },
    /**
     * Context Middleware:
     * Intercepts every request to validate the JWT token from the Authorization header.
     * If valid, injects the user object into the resolvers; otherwise, returns null.
     * This centralizes authentication logic, relieving resolvers from manual token parsing.
     */
    context: async ({ req }) => {
      const token = req.headers.authorization?.split(' ')[1] || '';
      console.log("[Context] Received token:", token ? "Yes" : "No"); 
      
      try {
        const decoded = verifyToken(token);
        console.log("[Context] Decoded payload:", decoded); 

        if (decoded && typeof decoded !== 'string' && (decoded as DecodedToken).userId) {
          const user = await User.findById((decoded as DecodedToken).userId);
          
          if (user && user.email) {
            const userForContext = {
              _id: user._id.toString(),
              email: user.email,   
              name: user.name || "Unnamed User",   
            };

            console.log("[Context] User found, returning context:", { user: userForContext }); 
            return { user: userForContext };
          }
        }
        console.warn("[Context] No valid user found or token invalid, returning null."); 
        return { user: null };
      } catch (error) {
        console.error('Context auth error:', error);
        return { user: null };
      }
    },
  });

  console.log(`🚀 Server ready at: ${url}`);
}

// Start the server
start().catch(console.error);