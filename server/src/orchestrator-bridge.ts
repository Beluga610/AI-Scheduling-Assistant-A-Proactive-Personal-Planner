/**
 * Python Agent Orchestrator Bridge
 * 
 * Provides TypeScript integration with the Python smolagents orchestrator.
 * This replaces the TypeScript HostAgent with calls to the Python multi-agent system.
 * 
 * Architecture:
 * - Game Engine (TS) manages game state
 * - Python Orchestrator handles agent coordination
 * - Bridge handles inter-process communication
 */

import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { Game } from "./domain/game.js";

interface OrchestrationConfig {
  pythonPath?: string;
  scriptPath: string;
  modelId?: string;
  provider?: string;
  timeout?: number;
}

interface AgentRegistration {
  playerId: string;
  name: string;
  persona: string;
}

/**
 * Bridge between TypeScript game engine and Python agent orchestrator
 * Handles spawn, communication, and lifecycle management
 */
export class PythonOrchestratorBridge extends EventEmitter {
  private process: ChildProcess | null = null;
  private config: OrchestrationConfig;
  private gameId: string;
  private messageBuffer: Array<{ type: string; data: any }> = [];
  private isConnected = false;

  constructor(gameId: string, config: OrchestrationConfig) {
    super();
    this.gameId = gameId;
    this.config = {
      pythonPath: config.pythonPath || "python3",
      scriptPath: config.scriptPath,
      modelId: config.modelId || "Qwen/Qwen2.5-Coder-32B-Instruct",
      provider: config.provider || "together",
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Start the Python orchestrator process
   */
  async start(game: Game, onBroadcast: (event: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Start Python subprocess
        this.process = spawn(this.config.pythonPath!, [this.config.scriptPath!], {
          stdio: ["pipe", "pipe", "pipe"],
          env: {
            ...process.env,
            GAME_ID: this.gameId,
            MODEL_ID: this.config.modelId,
            PROVIDER: this.config.provider,
          },
        });

        // Handle stdout (messages from Python)
        this.process.stdout!.on("data", (data) => {
          this._handlePythonMessage(data.toString(), onBroadcast, game);
        });

        // Handle stderr
        this.process.stderr!.on("data", (data) => {
          console.error("[Python Agent] stderr:", data.toString());
        });

        // Handle process exit
        this.process.on("exit", (code) => {
          this.isConnected = false;
          console.log(`[Python Agent] Process exited with code ${code}`);
        });

        // Register AI agents with the orchestrator
        this._registerAgents(game);

        // Start the game loop
        this._sendCommand("START", { gameId: this.gameId });

        this.isConnected = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the orchestrator gracefully
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      this._sendCommand("STOP", {});

      const timeout = setTimeout(() => {
        if (this.process) {
          this.process.kill("SIGKILL");
        }
        resolve();
      }, this.config.timeout!);

      this.process.on("exit", () => {
        clearTimeout(timeout);
        this.process = null;
        this.isConnected = false;
        resolve();
      });
    });
  }

  /**
   * Register AI agents with the orchestrator
   */
  private _registerAgents(game: Game): void {
    const aiPlayers = game.players.filter((p) => p.kind === "AI" && !p.isEliminated);

    for (const player of aiPlayers) {
      const registration: AgentRegistration = {
        playerId: player.id,
        name: player.name,
        persona:
          player.name === "Host AI"
            ? "You are a calm and concise host."
            : `You are ${player.name}. Stay in character.`,
      };

      this._sendCommand("REGISTER_AGENT", registration);
    }
  }

  /**
   * Send a command to the Python orchestrator
   */
  private _sendCommand(command: string, data: any): void {
    if (!this.process || !this.process.stdin) {
      console.warn(`Cannot send command ${command}: process not ready`);
      return;
    }

    const message = JSON.stringify({ command, data }) + "\n";
    this.process.stdin.write(message, "utf-8");
  }

  /**
   * Handle messages from the Python orchestrator
   */
  private _handlePythonMessage(
    rawData: string,
    onBroadcast: (event: any) => void,
    game: Game
  ): void {
    const lines = rawData.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      try {
        const message = JSON.parse(line);

        switch (message.type) {
          case "phase":
            // Update game phase and broadcast
            game.phase = message.data.phase;
            onBroadcast({ type: "phase", phase: message.data.phase, round: game.round });
            break;

          case "message":
            // Post a message from an agent
            game.postMessage(message.data.playerId, message.data.text);
            onBroadcast({ type: "message", round: game.round });
            break;

          case "notice":
            // Broadcast a notice to players
            onBroadcast({ type: "notice", text: message.data.text });
            break;

          case "result":
            // Handle round result
            onBroadcast({
              type: "result",
              result: message.data.result,
              round: game.round,
            });
            if (message.data.result !== "CONTINUE") {
              game.phase = "END";
            }
            break;

          case "error":
            console.error("[Python Agent] Error:", message.data.message);
            break;

          case "log":
            console.log("[Python Agent]", message.data.message);
            break;

          default:
            console.warn("[Python Agent] Unknown message type:", message.type);
        }
      } catch (error) {
        console.warn("[Bridge] Failed to parse message:", line, error);
      }
    }
  }
}

/**
 * Factory function to create a bridge instance
 */
export function createOrchestratorBridge(
  gameId: string,
  config: Partial<OrchestrationConfig> & { scriptPath: string }
): PythonOrchestratorBridge {
  return new PythonOrchestratorBridge(gameId, config as OrchestrationConfig);
}

/**
 * Hook into GraphQL resolvers to use the orchestrator
 * Usage in resolvers.ts:
 * 
 * const bridges = new Map<string, PythonOrchestratorBridge>();
 * 
 * Mutation: {
 *   startAuto: async (_, { gameId }) => {
 *     const bridge = createOrchestratorBridge(gameId, {
 *       scriptPath: "./agent_orchestrator.py",
 *     });
 *     
 *     const game = engine.get(gameId);
 *     await bridge.start(game, (event) => {
 *       console.log("[Host event]", event);
 *       // Handle broadcasting to WebSocket clients
 *     });
 *     
 *     bridges.set(gameId, bridge);
 *     return true;
 *   },
 * }
 */