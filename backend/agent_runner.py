import threading
import time


def make_agent_loop(name, agent_fn, context, interval=2):
    def loop():
        while True:
            status = context.get("agent_status", {})
            if status.get(name) == "idle" and context.get("topic"):
                context["agent_status"][name] = "running"
                try:
                    result = agent_fn(context)
                    if result is True:
                        context["agent_status"][name] = "done"
                    else:
                        context["agent_status"][name] = "idle"
                except Exception as e:
                    print(f"[{name}] error: {e}")
                    context["agent_status"][name] = "idle"
            time.sleep(interval)
    return loop


def start_agent_threads(context):
    from agents.scraper_agent import scraper_agent
    from agents.claim_agent import claim_agent
    from agents.narrative_agent import narrative_agent
    from agents.graph_agent import graph_agent

    agents = [
        ("scraper", scraper_agent),
        ("claim", claim_agent),
        ("narrative", narrative_agent),
        ("graph", graph_agent),
    ]
    for name, fn in agents:
        t = threading.Thread(
            target=make_agent_loop(name, fn, context),
            daemon=True
        )
        t.start()
        print(f"Started agent thread: {name}")
