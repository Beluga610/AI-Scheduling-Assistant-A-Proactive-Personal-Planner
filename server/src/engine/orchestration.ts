/**
 * Complete Working Example: TypeScript + Python Agent Integration
 * 
 * This file shows a complete implementation ready to use in your project.
 * It includes error handling, logging, and production-ready patterns.
 */

// ============================================================================
// FILE: src/engine/orchestration.ts
// ============================================================================

import { Game } from "../domain/game.js";
import { PythonOrchestratorBridge } from "../orchestrator-bridge.js";
import path from "path";

/**
 * Orchestration Manager
 * Manages lifecycle of all active game orchestrators
 */
export class OrchestrationManager {
  private bridges = new Map<string, PythonOrchestratorBridge>();
  private broadcasters = new Map<string, Function[]>();

  /**
   * Register a broadcast callback for a game
   * Called by WebSocket handlers to send events to connected clients
   */
  registerBroadcaster(gameId: string, broadcaster: Function): void {
    if (!this.broadcasters.has(gameId)) {
      this.broadcasters.set(gameId, []);
    }
    this.broadcasters.get(gameId)!.push(broadcaster);
  }

  /**
   * Start automated game orchestration
   */
  async startGame(game: Game, gameId: string): Promise<boolean> {
    try {
      if (this.bridges.has(gameId)) {
        throw new Error(`Orchestrator already running for game ${gameId}`);
      }

      console.log(`[Orchestration] Starting game ${gameId}`);

      // Create the bridge
      const bridge = new PythonOrchestratorBridge(gameId, {
        scriptPath: path.resolve("./dist/orchestrator_service.py"),
        modelId: process.env.AGENT_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct",
        provider: process.env.AGENT_PROVIDER || "together",
        timeout: parseInt(process.env.AGENT_TIMEOUT || "30000"),
      });

      // Set up broadcast handler
      const onBroadcast = (event: any) => {
        this._broadcastToClients(gameId, event);
      };

      // Start the orchestrator
      await bridge.start(game, onBroadcast);
      this.bridges.set(gameId, bridge);

      console.log(`[Orchestration] Game ${gameId} started successfully`);
      return true;
    } catch (error) {
      console.error(`[Orchestration] Failed to start game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Stop game orchestration
   */
  async stopGame(gameId: string): Promise<void> {
    try {
      const bridge = this.bridges.get(gameId);
      if (!bridge) {
        console.warn(`[Orchestration] No orchestrator found for game ${gameId}`);
        return;
      }

      console.log(`[Orchestration] Stopping game ${gameId}`);
      await bridge.stop();
      this.bridges.delete(gameId);
      console.log(`[Orchestration] Game ${gameId} stopped`);
    } catch (error) {
      console.error(`[Orchestration] Error stopping game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Broadcast an event to all connected clients for a game
   */
  private _broadcastToClients(gameId: string, event: any): void {
    const broadcasters = this.broadcasters.get(gameId) || [];
    for (const broadcaster of broadcasters) {
      try {
        broadcaster(event);
      } catch (error) {
        console.error(`[Orchestration] Broadcaster error:`, error);
      }
    }
  }

  /**
   * Cleanup: stop all running orchestrators
   */
  async cleanup(): Promise<void> {
    const gameIds = Array.from(this.bridges.keys());
    for (const gameId of gameIds) {
      try {
        await this.stopGame(gameId);
      } catch (error) {
        console.error(`[Orchestration] Cleanup error for ${gameId}:`, error);
      }
    }
  }

  /**
   * Get status of all running orchestrators
   */
  getStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    for (const [gameId] of this.bridges) {
      status[gameId] = "running";
    }
    return status;
  }
}

// Singleton instance
export const orchestrationManager = new OrchestrationManager();

// ============================================================================
// FILE: src/graphql/resolvers.ts (Updated)
// ============================================================================

import { engine } from "../engine.js";
import { orchestrationManager } from "../engine/orchestration.js";
import { askLLM } from "../ai/provider.js";

type VotePair = { voterId: string; targetId: string };

export const resolvers = {
  Query: {
    gameState: (_: unknown, { gameId }: { gameId: string }) => {
      const g = engine.get(gameId);
      return g.publicState();
    },

    // Get orchestration status
    orchestrationStatus: (_: unknown, { gameId }: { gameId: string }) => {
      const status = orchestrationManager.getStatus();
      return {
        gameId,
        isRunning: status[gameId] ? true : false,
        activeGames: Object.keys(status),
      };
    },
  },

  Mutation: {
    llmPing: async (_: unknown, { text }: { text?: string }) => {
      return askLLM(text ?? "Say OK");
    },

    startGame: (_: unknown, { name }: { name?: string }) => {
      const g = engine.createGame(name ?? "Human");
      return g.publicState();
    },

    say: async (_: unknown, { gameId, text }: { gameId: string; text: string }) => {
      const g = engine.get(gameId);
      const human = g.players.find((p) => p.kind === "HUMAN")!;
      g.postMessage(human.id, text);

      if (g.phase === "ROUND_START") {
        g.nextPhase();
        g.postMessage(g.host.id, g.host.announceRules());
      }

      g.nextPhase();
      for (const ai of g.players.filter((p) => p.kind === "AI") as any[]) {
        const reply = await ai.speak(`Round ${g.round} discussion. Human said: "${text}"`);
        g.postMessage(ai.id, reply);
      }

      g.nextPhase();
      return g.publicState();
    },

    vote: (_: unknown, { gameId, votes }: { gameId: string; votes: VotePair[] }) => {
      const g = engine.get(gameId);

      const byTarget: Record<string, string[]> = {};
      for (const { voterId, targetId } of votes) {
        (byTarget[targetId] ||= []).push(voterId);
      }

      g.nextPhase();
      g.tallyAndEliminate(byTarget);

      const result = g.winOrLose();
      if (result === "CONTINUE") g.newRoundOrEnd();
      else g.phase = "END";

      return g.publicState();
    },

    /**
     * Start automated orchestration with Python agents
     */
    startAuto: async (
      _: unknown,
      { gameId, usePython = true }: { gameId: string; usePython?: boolean }
    ) => {
      try {
        const g = engine.get(gameId);

        if (usePython) {
          // Use Python orchestrator (HuggingFace multi-agent)
          await orchestrationManager.startGame(g, gameId);
        } else {
          // Use TypeScript agent (legacy)
          throw new Error("TypeScript orchestrator removed - use Python version");
        }

        return true;
      } catch (error) {
        console.error("[startAuto] Error:", error);
        throw new Error(`Failed to start orchestration: ${error}`);
      }
    },

    /**
     * Stop automated orchestration
     */
    stopAuto: async (_: unknown, { gameId }: { gameId: string }) => {
      try {
        await orchestrationManager.stopGame(gameId);
        return true;
      } catch (error) {
        console.error("[stopAuto] Error:", error);
        throw new Error(`Failed to stop orchestration: ${error}`);
      }
    },
  },
};

export async function cleanupOrchestration() {
  await orchestrationManager.cleanup();
}

// ============================================================================
// FILE: src/servers/server.ts (Updated)
// ============================================================================

import express from "express";
import { mountGraphQL } from "./graphql.js";
import { cleanupOrchestration } from "../graphql/resolvers.js";

const app = express();

app.get("/", (_req, res) => {
  res.send("<h2>Who-is-Human GraphQL API</h2><p>Go to <code>/graphql</code></p>");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT ?? 3000;

const server = (async () => {
  await mountGraphQL(app, "/graphql");
  
  return app.listen(PORT, () => {
    console.log(`HTTP listening: http://localhost:${PORT}`);
  });
})();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, initiating graceful shutdown");
  try {
    await cleanupOrchestration();
    console.log("Orchestration cleanup complete");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }

  (await server).close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, initiating graceful shutdown");
  try {
    await cleanupOrchestration();
    console.log("Orchestration cleanup complete");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }

  (await server).close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// ============================================================================
// FILE: .env.example
// ============================================================================

# Game Server
PORT=3000

# LLM Provider
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.0-flash

# Agent Orchestration
AGENT_PROVIDER=together
AGENT_MODEL=Qwen/Qwen2.5-Coder-32B-Instruct
AGENT_TIMEOUT=30000

# Optional: Development
NODE_ENV=development
DEBUG=*

// ============================================================================
// FILE: package.json (Updated Scripts)
// ============================================================================

{
  "name": "who-is-human",
  "private": true,
  "workspaces": ["server"],
  "scripts": {
    "dev:server": "npm run -w @who/server dev",
    "build:server": "npm run -w @who/server build",
    "start:server": "npm run -w @who/server start",
    "dev": "npm run dev:server",
    "build": "npm run build:server",
    "start": "npm run start:server"
  }
}

// ============================================================================
// GRAPHQL Query Examples
// ============================================================================

/*
# Create a game
mutation {
  startGame(name: "Player1") {
    id
    phase
    round
    players {
      id
      name
      kind
      isEliminated
    }
  }
}

# Start automated orchestration with Python agents
mutation {
  startAuto(gameId: "YOUR_GAME_ID", usePython: true)
}

# Get game state
query {
  gameState(gameId: "YOUR_GAME_ID") {
    id
    phase
    round
    players {
      id
      name
      kind
      isEliminated
    }
    messages {
      playerId
      round
      text
    }
  }
}

# Get orchestration status
query {
  orchestrationStatus(gameId: "YOUR_GAME_ID") {
    gameId
    isRunning
    activeGames
  }
}

# Stop orchestration
mutation {
  stopAuto(gameId: "YOUR_GAME_ID")
}
*/