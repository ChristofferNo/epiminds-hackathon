from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.context import shared_context

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
