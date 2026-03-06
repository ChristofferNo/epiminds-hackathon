"""
MILOU - Trust Intelligence Platform
Backend: FastAPI + WebSocket + Autonomous AI Agent Swarm

Run with: uvicorn main:app --reload --port 8000
"""

import asyncio
import json
import uuid
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from shared_state import SharedState
from agents.scout import ScoutAgent
from agents.lingua import LinguaAgent
from agents.veritas import VeritasAgent
from agents.pixel import PixelAgent
from agents.echo import EchoAgent
from agents.spider import SpiderAgent
from agents.ghost import GhostAgent
from agents.trace import TraceAgent
from agents.rex import RexAgent

app = FastAPI(title="Milou Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global shared state — every agent reads and writes here
shared_state = SharedState()

# Track active WebSocket connections (for broadcasting)
active_connections: list[WebSocket] = []

# Track running agent tasks (for kill switch)
agent_tasks: dict[str, asyncio.Task] = {}


async def broadcast(message: dict):
    """Send a message to all connected frontend clients."""
    data = json.dumps(message)
    for ws in active_connections:
        try:
            await ws.send_text(data)
        except Exception:
            pass


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print(f"Frontend connected. Total connections: {len(active_connections)}")

    try:
        # Send current state immediately on connect
        await websocket.send_text(json.dumps({
            "type": "state_snapshot",
            "data": shared_state.get_full_state()
        }))

        # Listen for messages from frontend (e.g. kill switch)
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg.get("type") == "kill_agent":
                agent_id = msg.get("agent_id")
                await kill_agent(agent_id)
                await broadcast({"type": "agent_killed", "agent_id": agent_id})

            elif msg.get("type") == "revive_agent":
                agent_id = msg.get("agent_id")
                await revive_agent(agent_id, shared_state.topic)

    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print("Frontend disconnected")


@app.post("/investigate")
async def start_investigation(body: dict):
    """
    Start a new swarm investigation.
    POST body: { "topic": "War in Iran" }
    """
    topic = body.get("topic", "")
    depth = body.get("depth", "deep")  # "quick" or "deep"

    if not topic:
        return {"error": "Topic required"}

    # Reset shared state for new investigation
    shared_state.reset(topic)
    agent_tasks.clear()

    # Broadcast to frontend that investigation started
    await broadcast({
        "type": "investigation_started",
        "topic": topic,
        "depth": depth,
        "timestamp": datetime.now().isoformat()
    })

    # Launch all agents as independent async tasks
    # IMPORTANT: No agent orchestrates another. Each has its own loop.
    agents = [
        ScoutAgent("scout", shared_state, broadcast),
        PixelAgent("pixel", shared_state, broadcast),
        EchoAgent("echo", shared_state, broadcast),
        LinguaAgent("lingua", shared_state, broadcast),
        VeritasAgent("veritas", shared_state, broadcast),
        SpiderAgent("spider", shared_state, broadcast),
        GhostAgent("ghost", shared_state, broadcast),
        TraceAgent("trace", shared_state, broadcast),
        RexAgent("rex", shared_state, broadcast),
    ]

    for agent in agents:
        task = asyncio.create_task(agent.run(topic, depth))
        agent_tasks[agent.agent_id] = task

    return {"status": "started", "topic": topic, "agents": len(agents)}


@app.get("/state")
async def get_state():
    """REST fallback — returns current shared state snapshot."""
    return shared_state.get_full_state()


async def kill_agent(agent_id: str):
    """Cancel an agent task (simulates agent failure)."""
    task = agent_tasks.get(agent_id)
    if task and not task.done():
        task.cancel()
        shared_state.set_agent_status(agent_id, active=False)
        print(f"Agent {agent_id} killed")


async def revive_agent(agent_id: str, topic: str):
    """Restart a killed agent."""
    shared_state.set_agent_status(agent_id, active=True)
    print(f"Agent {agent_id} revived — restarting")
    # You can add re-instantiation logic here if needed
