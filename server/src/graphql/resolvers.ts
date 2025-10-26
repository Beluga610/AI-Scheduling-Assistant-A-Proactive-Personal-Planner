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

    orchestrationStatus: () => {
      return orchestrationManager.getStatus();
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

    // ============================================================================
    // UPDATED: Automated host loop controls using new OrchestrationManager
    // ============================================================================
    startAuto: async (_: unknown, { gameId }: { gameId: string }) => {
      try {
        const g = engine.get(gameId);
        
        // Check if already running
        if (orchestrationManager.isRunning(gameId)) {
          console.warn(`[Resolver] Orchestration already running for game ${gameId}`);
          return true;
        }

        console.log(`[Resolver] Starting automated orchestration for game ${gameId}`);
        await orchestrationManager.startGame(g, gameId);
        
        return true;
      } catch (error) {
        console.error(`[Resolver] Failed to start orchestration:`, error);
        throw error;
      }
    },

    stopAuto: async (_: unknown, { gameId }: { gameId: string }) => {
      try {
        console.log(`[Resolver] Stopping orchestration for game ${gameId}`);
        await orchestrationManager.stopGame(gameId);
        return true;
      } catch (error) {
        console.error(`[Resolver] Failed to stop orchestration:`, error);
        throw error;
      }
    },
  },
};