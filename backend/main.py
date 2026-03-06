from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from Backend.context import shared_context
from agents.scraper_agent import scraper_agent
from agents.claim_agent import claim_agent
from agents.credibility_agent import check_credibility

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


@app.post("/run-credibility")
def run_credibility():
    check_credibility(shared_context)
    return shared_context
