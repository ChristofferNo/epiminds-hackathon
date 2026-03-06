def graph_agent(context: dict) -> None:
    if not context.get("claims"):
        return

    if not context.get("narratives"):
        return

    if context.get("graph"):
        return

    print("\nRunning Graph Builder Agent")

    nodes = []
    edges = []

    # Source nodes
    source_ids = {}
    for i, doc in enumerate(context.get("documents", [])):
        source_id = f"source_{i + 1}"
        source_ids[i] = source_id
        nodes.append({
            "id": source_id,
            "type": "source",
            "label": doc.get("url", f"source_{i + 1}")
        })

    # Claim nodes — build a mapping from claim text to claim_id
    claim_text_to_id = {}
    claim_counter = 1
    for i, item in enumerate(context.get("claims", [])):
        for claim_text in item.get("claims", []):
            if claim_text not in claim_text_to_id:
                claim_id = f"claim_{claim_counter}"
                claim_text_to_id[claim_text] = claim_id
                nodes.append({
                    "id": claim_id,
                    "type": "claim",
                    "label": claim_text
                })
                claim_counter += 1
            # Edge: source → claim
            edges.append({
                "source": source_ids.get(i, f"source_{i + 1}"),
                "target": claim_text_to_id[claim_text]
            })

    # Narrative nodes + claim → narrative edges
    for i, narrative in enumerate(context.get("narratives", [])):
        narrative_id = f"narrative_{i + 1}"
        nodes.append({
            "id": narrative_id,
            "type": "narrative",
            "label": narrative.get("theme", narrative_id)
        })
        for claim_text in narrative.get("claims", []):
            claim_id = claim_text_to_id.get(claim_text)
            if claim_id:
                edges.append({
                    "source": claim_id,
                    "target": narrative_id
                })

    context["graph"] = {
        "nodes": nodes,
        "edges": edges
    }

    print("Graph built")
    print("Nodes:", len(nodes))
    print("Edges:", len(edges))
