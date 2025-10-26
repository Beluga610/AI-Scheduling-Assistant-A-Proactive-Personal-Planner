#!/usr/bin/env python3
"""
Orchestrator Service Runner
Runs the agent orchestrator as a service receiving commands via stdin
Sends events via stdout (one JSON object per line)

This allows TypeScript to spawn this as a subprocess and communicate via pipes.
"""

import asyncio
import json
import os
import sys
from typing import Optional, Dict, Any
import signal


class OrchestratorService:
    """Service that manages the orchestrator lifecycle via stdio"""

    def __init__(self):
        self.orchestrator: Optional[Any] = None
        self.game_id = os.getenv("GAME_ID", "unknown")
        self.model_id = os.getenv("MODEL_ID", "Qwen/Qwen2.5-Coder-32B-Instruct")
        self.provider = os.getenv("PROVIDER", "together")
        self.running = False
        self.game_state: Dict[str, Any] = {}

    def log(self, message: str, level: str = "info"):
        """Send log message to parent process"""
        self.send_event("log", {"message": message, "level": level})

    def send_event(self, event_type: str, data: Dict[str, Any]):
        """Send an event to the parent process via stdout"""
        event = {"type": event_type, "data": data}
        print(json.dumps(event), flush=True)

    def get_game_state(self, game_id: str) -> Dict[str, Any]:
        """
        Fetch game state from parent process
        In a real scenario, this would make an HTTP request to the GraphQL API
        or receive state through another IPC mechanism
        """
        # Placeholder - in production, call the GraphQL API
        return {
            "phase": "DISCUSS",
            "round": 1,
            "players": [],
            "messages": [],
        }

    async def handle_command(self, command: str, data: Dict[str, Any]):
        """Handle commands from parent process"""
        try:
            if command == "START":
                await self.start_game(data.get("gameId"))

            elif command == "REGISTER_AGENT":
                self.register_agent(data)

            elif command == "STOP":
                await self.stop_game()

            elif command == "BROADCAST":
                self.send_event(data.get("type"), data.get("data", {}))

            else:
                self.send_event(
                    "error", {"message": f"Unknown command: {command}"}
                )

        except Exception as e:
            self.send_event("error", {"message": str(e)})

    async def start_game(self, game_id: str):
        """Initialize and start the orchestrator"""
        try:
            from agent_orchestrator import (
                HostAgentOrchestrator,
                PhaseDurations,
                GameEvent,
            )

            self.game_id = game_id
            self.log(f"Starting orchestrator for game {game_id}")

            # Create orchestrator
            self.orchestrator = HostAgentOrchestrator(
                game_id=game_id,
                game_state_getter=self.get_game_state,
                broadcast_callback=self._on_broadcast,
                durations=PhaseDurations(),
                model_id=self.model_id,
                provider=self.provider,
            )

            # Start the game loop in background
            self.running = True
            asyncio.create_task(self.orchestrator.start())

            self.send_event("info", {"message": "Orchestrator started"})

        except ImportError as e:
            self.send_event("error", {"message": f"Import error: {e}"})
        except Exception as e:
            self.send_event("error", {"message": f"Failed to start: {e}"})

    def register_agent(self, data: Dict[str, Any]):
        """Register an AI agent with the orchestrator"""
        if not self.orchestrator:
            self.send_event("error", {"message": "Orchestrator not initialized"})
            return

        try:
            agent = self.orchestrator.register_ai_agent(
                agent_id=data["playerId"],
                name=data["name"],
                persona=data.get("persona", ""),
            )
            self.log(f"Registered agent: {data['name']}")
        except Exception as e:
            self.send_event("error", {"message": f"Failed to register agent: {e}"})

    async def stop_game(self):
        """Stop the orchestrator gracefully"""
        if self.orchestrator:
            await self.orchestrator.stop()
        self.running = False
        self.send_event("info", {"message": "Orchestrator stopped"})

    def _on_broadcast(self, event: "GameEvent"):
        """Callback when orchestrator broadcasts an event"""
        self.send_event(event.type, event.data)

    async def run(self):
        """Main service loop - read commands from stdin"""
        self.log("Orchestrator service started")
        self.send_event("ready", {})

        loop = asyncio.get_event_loop()

        # Handle signals
        def handle_signal(signum, frame):
            self.log(f"Received signal {signum}, shutting down")
            loop.create_task(self.stop_game())

        signal.signal(signal.SIGTERM, handle_signal)
        signal.signal(signal.SIGINT, handle_signal)

        # Read commands from stdin
        while self.running:
            try:
                # Read line from stdin in a non-blocking way
                line = await loop.run_in_executor(None, sys.stdin.readline)

                if not line:
                    # EOF reached
                    break

                line = line.strip()
                if not line:
                    continue

                try:
                    message = json.loads(line)
                    command = message.get("command")
                    data = message.get("data", {})

                    await self.handle_command(command, data)

                except json.JSONDecodeError:
                    self.send_event("error", {"message": f"Invalid JSON: {line}"})

            except EOFError:
                break
            except Exception as e:
                self.send_event("error", {"message": f"Error in main loop: {e}"})

        self.log("Orchestrator service stopped")


async def main():
    """Entry point for the service"""
    service = OrchestratorService()
    await service.run()


if __name__ == "__main__":
    # Run the async service
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(json.dumps({"type": "error", "data": {"message": str(e)}}), flush=True)
        sys.exit(1)