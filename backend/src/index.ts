import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ApolloServer } from "apollo-server-express";
import fs from "fs";
import path from "path";

dotenv.config();
const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGODB_URI || "mongodb://localhost:27017/llm_calendar_demo";

async function start() {
  // connect db
  await mongoose.connect(MONGO);
  console.log("MongoDB connected");

  const app = express();
  app.use(cors());
  app.use(express.json());

  // if frontend build exists, serve static files (so full app can be served from port 4000)
  const frontDist = path.join(__dirname, "..", "..", "frontend-react", "dist");
  if (fs.existsSync(frontDist)) {
    app.use(express.static(frontDist));
    app.get("/", (_req, res) => {
      res.sendFile(path.join(frontDist, "index.html"));
    });
    console.log("Serving frontend from:", frontDist);
  }

  // load SDL from file
  const typeDefs = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8");

  // lazy import resolvers
  const resolvers = require("./resolvers").resolvers;

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();
  server.applyMiddleware({ app, path: "/graphql", cors: false });

  app.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

start().catch(err => {
  console.error("Failed to start server", err);
});
