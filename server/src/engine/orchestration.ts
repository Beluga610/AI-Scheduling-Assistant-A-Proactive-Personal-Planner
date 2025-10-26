import { Game } from "../domain/game.js";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration - Single Source of Truth
// ============================================================================
export const AGENT_CONFIG = {
  MODEL_ID: process.env.AGENT_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct",
  PROVIDER: process.env.AGENT_PROVIDER || "together",
  TIMEOUT: parseInt(process.env.AGENT_TIMEOUT || "30000", 10),
} as const;

// ============================================================================
// Python Bridge - Spawns and manages Python orchestrator process
// ============================================================================
class PythonOrchestratorBridge {
  private process: ChildProcess | null = null;
  private gameId: string;
  private scriptPath: string;
  private config: {
    modelId: string;
    provider: string;
    timeout: number;
  };

  constructor(
    gameId: string,
    config: {
      scriptPath: string;
      modelId: string;
      provider: string;
      timeout: number;
    }
  ) {
    this.gameId = gameId;
    this.scriptPath = config.scriptPath;
    this.config = {
      modelId: config.modelId,
      provider: config.provider,
      timeout: config.timeout,
    };
  }

  /**
   * Start the Python orchestrator process
   */
  async start(gameState: any, onBroadcast: (event: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if Python script exists
        const fs = require("fs");
        if (!fs.existsSync(this.scriptPath)) {
          throw new Error(`Python script not found at: ${this.scriptPath}`);
        }

        console.log(`[Bridge] Starting Python process for game ${this.gameId}`);
        console.log(`[Bridge] Script path: ${this.scriptPath}`);
        console.log(`[Bridge] Model: ${this.config.modelId} (${this.config.provider})`);

        this.process = spawn("python3", [this.scriptPath], {
          stdio: ["pipe", "pipe", "pipe"],
          env: {
            ...process.env,
            GAME_ID: this.gameId,
            GAME_STATE: JSON.stringify(gameState),
            AGENT_MODEL: this.config.modelId,
            AGENT_PROVIDER: this.config.provider,
            AGENT_TIMEOUT: this.config.timeout.toString(),
          },
        });

        let startupComplete = false;

        // Handle process output - parse JSON events
        this.process.stdout?.on("data", (data) => {
          const lines = data.toString().split("\n").filter((l: string) => l.trim());
          
          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              onBroadcast(event);
              
              // Check for startup completion event
              if (event.type === "startup_complete") {
                startupComplete = true;
              }
            } catch (err) {
              // Not JSON - log as regular output
              console.log(`[Bridge] Python: ${line}`);
            }
          }
        });

        // Handle errors
        this.process.stderr?.on("data", (data) => {
          const errorText = data.toString();
          console.error(`[Bridge] Python Error: ${errorText}`);
          
          // Check for import errors or critical failures
          if (errorText.includes("ModuleNotFoundError") || 
              errorText.includes("ImportError") ||
              errorText.includes("CRITICAL")) {
            if (!startupComplete) {
              reject(new Error(`Python startup failed: ${errorText}`));
            }
          }
        });

        // Handle process spawn errors
        this.process.on("error", (err) => {
          console.error("[Bridge] Failed to start Python process:", err);
          reject(err);
        });

        // Handle process exit
        this.process.on("exit", (code, signal) => {
          console.log(`[Bridge] Process exited - code: ${code}, signal: ${signal}`);
          
          if (code !== 0 && code !== null && !startupComplete) {
            reject(new Error(`Python process exited with code ${code}`));
          }
        });

        // Wait for startup - either explicit event or timeout
        const startupTimeout = setTimeout(() => {
          if (!startupComplete) {
            console.warn("[Bridge] No startup_complete event received, assuming success");
          }
          resolve();
        }, 2000);

        // Clear timeout if we get explicit startup event
        const originalOnBroadcast = onBroadcast;
        onBroadcast = (event: any) => {
          if (event.type === "startup_complete") {
            clearTimeout(startupTimeout);
            resolve();
          }
          originalOnBroadcast(event);
        };

      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Stop the Python process gracefully
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      console.log(`[Bridge] Stopping Python process for game ${this.gameId}`);

      let resolved = false;
      const resolveOnce = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      // Listen for exit
      this.process.on("exit", resolveOnce);

      // Try graceful shutdown
      this.process.kill("SIGTERM");

      // Force kill after timeout
      setTimeout(() => {
        if (this.process && !resolved) {
          console.warn("[Bridge] Force killing process");
          this.process.kill("SIGKILL");
        }
        resolveOnce();
      }, 5000);
    });
  }

  /**
   * Check if the process is still running
   */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}

// ============================================================================
// Orchestration Manager - Manages multiple game orchestrations
// ============================================================================
export class OrchestrationManager {
  private bridges = new Map<string, PythonOrchestratorBridge>();
  private broadcasters = new Map<string, Function[]>();

  /**
   * Register a broadcast callback for a game
   * Called by WebSocket/GraphQL subscription handlers
   */
  registerBroadcaster(gameId: string, broadcaster: Function): void {
    if (!this.broadcasters.has(gameId)) {
      this.broadcasters.set(gameId, []);
    }
    this.broadcasters.get(gameId)!.push(broadcaster);
    console.log(`[Orchestration] Registered broadcaster for game ${gameId}`);
  }

  /**
   * Unregister a broadcast callback
   */
  unregisterBroadcaster(gameId: string, broadcaster: Function): void {
    const list = this.broadcasters.get(gameId);
    if (list) {
      const idx = list.indexOf(broadcaster);
      if (idx >= 0) {
        list.splice(idx, 1);
        console.log(`[Orchestration] Unregistered broadcaster for game ${gameId}`);
      }
      if (list.length === 0) {
        this.broadcasters.delete(gameId);
      }
    }
  }

  /**
   * Start automated game orchestration
   */
  async startGame(game: Game, gameId: string): Promise<boolean> {
    try {
      // Check if already running
      if (this.bridges.has(gameId)) {
        throw new Error(`Orchestrator already running for game ${gameId}`);
      }

      console.log(`[Orchestration] Starting game ${gameId}`);

      // Determine Python script path
      // Try multiple locations for robustness
      const possiblePaths = [
        path.resolve(__dirname, "../engine/agent_orchestrator.py"),
        path.resolve(__dirname, "../../src/engine/agent_orchestrator.py"),
        path.resolve(process.cwd(), "server/src/engine/agent_orchestrator.py"),
      ];

      const fs = require("fs");
      let scriptPath: string | null = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          scriptPath = p;
          break;
        }
      }

      if (!scriptPath) {
        throw new Error(
          `Python orchestrator script not found. Tried:\n${possiblePaths.join("\n")}`
        );
      }

      // Create bridge
      const bridge = new PythonOrchestratorBridge(gameId, {
        scriptPath,
        modelId: AGENT_CONFIG.MODEL_ID,
        provider: AGENT_CONFIG.PROVIDER,
        timeout: AGENT_CONFIG.TIMEOUT,
      });

      // Set up broadcast handler
      const onBroadcast = (event: any) => {
        this._broadcastToClients(gameId, event);
      };

      // Start the bridge with serialized game state
      const gameState = game.publicState();
      await bridge.start(gameState, onBroadcast);
      
      this.bridges.set(gameId, bridge);
      console.log(`[Orchestration] Game ${gameId} started successfully`);
      
      return true;
    } catch (error) {
      console.error(`[Orchestration] Failed to start game ${gameId}:`, error);
      
      // Ensure cleanup on error
      try {
        await this.stopGame(gameId);
      } catch (cleanupErr) {
        console.error(`[Orchestration] Cleanup error:`, cleanupErr);
      }
      
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
      this.broadcasters.delete(gameId);
      
      console.log(`[Orchestration] Game ${gameId} stopped`);
    } catch (error) {
      console.error(`[Orchestration] Error stopping game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Broadcast an event to all connected clients for a game
   */
  private async _broadcastToClients(gameId: string, event: any): Promise<void> {
    const broadcasters = this.broadcasters.get(gameId) || [];
    
    if (broadcasters.length === 0) {
      console.log(`[Orchestration] No broadcasters for game ${gameId}, event:`, event.type);
      return;
    }

    console.log(`[Orchestration] Broadcasting ${event.type} to ${broadcasters.length} clients`);

    const promises = broadcasters.map(async (broadcaster) => {
      try {
        const result = broadcaster(event);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error(`[Orchestration] Broadcaster error:`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }

  /**
   * Check if orchestration is running for a game
   */
  isRunning(gameId: string): boolean {
    const bridge = this.bridges.get(gameId);
    return bridge !== undefined && bridge.isRunning();
  }

  /**
   * Cleanup: stop all running orchestrators
   */
  async cleanup(): Promise<void> {
    console.log("[Orchestration] Cleaning up all orchestrators");
    const gameIds = Array.from(this.bridges.keys());
    
    for (const gameId of gameIds) {
      try {
        await this.stopGame(gameId);
      } catch (error) {
        console.error(`[Orchestration] Cleanup error for ${gameId}:`, error);
      }
    }
    
    console.log("[Orchestration] Cleanup complete");
  }

  /**
   * Get status of all running orchestrators
   */
  getStatus(): Record<string, { running: boolean; broadcasters: number }> {
    const status: Record<string, { running: boolean; broadcasters: number }> = {};
    
    for (const [gameId, bridge] of this.bridges) {
      status[gameId] = {
        running: bridge.isRunning(),
        broadcasters: this.broadcasters.get(gameId)?.length || 0,
      };
    }
    
    return status;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================
export const orchestrationManager = new OrchestrationManager();

/**
 * Global cleanup function for graceful shutdown
 */
export async function cleanupOrchestration(): Promise<void> {
  await orchestrationManager.cleanup();
}

// Handle process termination
if (typeof process !== "undefined") {
  process.on("SIGTERM", async () => {
    console.log("[Orchestration] Received SIGTERM, cleaning up...");
    await cleanupOrchestration();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("[Orchestration] Received SIGINT, cleaning up...");
    await cleanupOrchestration();
    process.exit(0);
  });
}