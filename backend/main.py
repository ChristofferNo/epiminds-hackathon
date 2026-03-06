from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from Backend.context import shared_context
from Backend.agent_runner import start_agent_threads

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    start_agent_threads(shared_context)


class TopicRequest(BaseModel):
    topic: str


@app.post("/topic")
def set_topic(request: TopicRequest):
    shared_context["topic"] = request.topic
    return {"status": "ok", "topic": shared_context["topic"]}


@app.get("/context")
def get_context():
    return shared_context


@app.post("/run-agents")
def run_agents_compat():
    # Agents run autonomously as background threads — this endpoint exists for frontend compatibility
    return {"status": "agents running in background"}


@app.post("/reset")
def reset_context():
    shared_context["topic"] = ""
    shared_context["documents"] = []
    shared_context["claims"] = []
    shared_context["narratives"] = []
    shared_context["graph"] = {}
    for key in shared_context["agent_status"]:
        shared_context["agent_status"][key] = "idle"
    return {"status": "reset"}
