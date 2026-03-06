from agents.scraper_agent import scraper_agent
from agents.claim_agent import claim_agent
from agents.narrative_agent import narrative_agent
from agents.graph_agent import graph_agent

agents = [
    scraper_agent,
    claim_agent,
    narrative_agent,
    graph_agent,
]


def run_agents(context: dict) -> None:
    print("\nStarting agent network\n")

    for agent in agents:
        agent(context)

    print("\nAgent network cycle complete\n")
