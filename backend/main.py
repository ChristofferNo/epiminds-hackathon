from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.context import shared_context
from agents.scraper_agent import scraper_agent
from agents.claim_agent import claim_agent
from agents.narrative_agent import narrative_agent
from agents.graph_agent import graph_agent
from backend.agent_runner import run_agents

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TopicRequest(BaseModel):
    topic: str


@app.post("/topic")
def set_topic(request: TopicRequest):
    shared_context["topic"] = request.topic
    return {"status": "ok", "topic": shared_context["topic"]}


@app.get("/context")
def get_context():
    return shared_context


@app.post("/run-scraper")
def run_scraper():
    scraper_agent(shared_context)
    return shared_context


@app.post("/run-claims")
def run_claims():
    claim_agent(shared_context)
    return shared_context


@app.post("/run-narratives")
def run_narratives():
    narrative_agent(shared_context)
    return shared_context


@app.post("/run-graph")
def run_graph():
    graph_agent(shared_context)
    return shared_context


@app.post("/run-agents")
def run_all_agents():
    run_agents(shared_context)
    return shared_context


@app.post("/reset")
def reset_context():
    shared_context["topic"] = ""
    shared_context["documents"] = []
    shared_context["claims"] = []
    shared_context["narratives"] = []
    shared_context["graph"] = {}
    return {"status": "reset"}
