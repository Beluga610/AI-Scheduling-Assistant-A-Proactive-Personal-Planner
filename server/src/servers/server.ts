import express from "express";
import { mountGraphQL } from "../servers/graphql.js";
import { orchestrationManager, cleanupOrchestration } from "../engine/orchestration.js";

const app = express();
app.get("/", (_req, res) => {
  res.send("<h2>Who-is-Human GraphQL API</h2><p>Go to <code>/graphql</code></p>");
});

const PORT = process.env.PORT ?? 3000;

(async () => {
  try {
    // Mount GraphQL server
    await mountGraphQL(app, "/graphql");
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`HTTP listening: http://localhost:${PORT}`);
      console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      
      try {
        await cleanupOrchestration();
        console.log("Orchestration cleanup completed");
      } catch (error) {
        console.error("Error during orchestration cleanup:", error);
      }
      
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();