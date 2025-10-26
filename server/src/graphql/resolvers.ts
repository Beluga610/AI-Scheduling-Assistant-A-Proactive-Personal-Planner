/**
 * GraphQL Resolvers with Python Agent Orchestrator Integration
 * 
 * This shows how to modify resolvers.ts to use the Python-based multi-agent system
 * instead of the TypeScript HostAgent
 */

import { engine } from "../engine.js";
import { createOrchestratorBridge } from "../orchestrator-bridge.js";
import { askLLM } from "../ai/provider.js";
import { PythonOrchestratorBridge } from "../orchestrator-bridge.js";

type VotePair = { voterId: string; targetId: string };

// Keep track of active orchestrator bridges
const activeBridges = new Map<string, PythonOrchestratorBridge>();

export const resolvers = {
  Query: {
    gameState: (_: unknown, { gameId }: { gameId: string }) => {
      const g = engine.get(gameId);
      return g.publicState();
    },
  },

  Mutation: {
    // Healthcheck for the LLM wiring
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

      // First message of the game → host announces rules
      if (g.phase === "ROUND_START") {
        g.nextPhase(); // HOST_ANNOUNCE
        g.postMessage(g.host.id, g.host.announceRules());
      }

      // Discussion: each AI replies
      g.nextPhase(); // DISCUSS
      for (const ai of g.players.filter((p) => p.kind === "AI") as any[]) {
        const reply = await ai.speak(`Round ${g.round} discussion. Human said: "${text}"`);
        g.postMessage(ai.id, reply);
      }

      // Move to summary
      g.nextPhase(); // SUMMARY
      return g.publicState();
    },

    vote: (_: unknown, { gameId, votes }: { gameId: string; votes: VotePair[] }) => {
      const g = engine.get(gameId);

      const byTarget: Record<string, string[]> = {};
      for (const { voterId, targetId } of votes) {
        (byTarget[targetId] ||= []).push(voterId);
      }

      g.nextPhase(); // VOTE
      g.tallyAndEliminate(byTarget);

      const result = g.winOrLose();
      if (result === "CONTINUE") g.newRoundOrEnd();
      else g.phase = "END";

      return g.publicState();
    },

    /**
     * PYTHON ORCHESTRATOR: Start automated game with multi-agent system
     * 
     * This uses the HuggingFace smolagents pattern:
     * - Manager Agent coordinates game flow
     * - Individual AI Agents handle discussion
     * - Distributed task handling and memory management
     */
    startAuto: async (_: unknown, { gameId }: { gameId: string }) => {
      try {
        const g = engine.get(gameId);

        // Create the orchestrator bridge
        const bridge = createOrchestratorBridge(gameId, {
          scriptPath: new URL("../orchestrator_service.py", import.meta.url).pathname,
          modelId: process.env.GEMINI_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct",
          provider: process.env.AGENT_PROVIDER || "together",
        });

        // Define broadcast callback
        const onBroadcast = (event: any) => {
          console.log("[Host event]", event);
          // TODO: Send to WebSocket clients connected to this game
          // e.g., broadcastToGameClients(gameId, event)
        };

        // Start the orchestrator
        await bridge.start(g, onBroadcast);

        // Store bridge for cleanup later
        activeBridges.set(gameId, bridge);

        return true;
      } catch (error) {
        console.error("[Orchestrator] Failed to start:", error);
        throw error;
      }
    },

    stopAuto: async (_: unknown, { gameId }: { gameId: string }) => {
      try {
        const bridge = activeBridges.get(gameId);
        if (bridge) {
          await bridge.stop();
          activeBridges.delete(gameId);
        }
        return true;
      } catch (error) {
        console.error("[Orchestrator] Failed to stop:", error);
        throw error;
      }
    },

    /**
     * ALTERNATIVE: Manual orchestration without Python
     * Use this if you want TypeScript-only agent management
     */
    startAutoLegacy: async (_: unknown, { gameId }: { gameId: string }) => {
      // Import the TypeScript agent if needed
      // const { HostAgent } = await import("../engine/hostAgent.js");
      // ... original logic
      return true;
    },
  },
};

/**
 * Export for cleanup on server shutdown
 * Call this in your server's graceful shutdown handler
 */
export async function cleanupOrchestratorBridges() {
  const shutdownPromises = Array.from(activeBridges.values()).map((bridge) =>
    bridge.stop().catch((err) => console.error("Cleanup error:", err))
  );

  await Promise.all(shutdownPromises);
  activeBridges.clear();
}