import threading
import time


OUTPUT_KEYS = {
    "scraper": "documents",
    "claim": "claims",
    "narrative": "narratives",
    "graph": "graph",
}


def make_agent_loop(name, agent_fn, context, interval=2):
    output_key = OUTPUT_KEYS[name]

    def loop():
        while True:
            status = context.get("agent_status", {})
            if status.get(name) == "idle" and context.get("topic"):
                before = len(context[output_key]) if isinstance(context[output_key], list) else bool(context[output_key])
                context["agent_status"][name] = "running"
                try:
                    agent_fn(context)
                    after = len(context[output_key]) if isinstance(context[output_key], list) else bool(context[output_key])
                    if after and after != before:
                        context["agent_status"][name] = "done"
                    else:
                        # Preconditions not met yet — stay idle and retry
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
