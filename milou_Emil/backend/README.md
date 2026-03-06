# Milou — Backend Setup

## Quick Start (5 minutes)

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set your API key
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Run the server
```bash
uvicorn main:app --reload --port 8000
```

### 4. Test it works
```bash
curl -X POST http://localhost:8000/investigate \
  -H "Content-Type: application/json" \
  -d '{"topic": "War in Iran", "depth": "deep"}'
```

---

## Architecture

```
main.py              — FastAPI server, WebSocket hub, kill switch
shared_state.py      — The collective brain (all agents read/write here)
agents/
  base_agent.py      — Base class: LLM calls, finding format, swarm reactions
  scout.py           — News source hunter
  lingua.py          — Language & AI text analysis
  veritas.py         — Source verification
  pixel.py           — Image analysis
  echo.py            — Social media monitoring
  spider.py          — Cross-reference & narrative tracking
  ghost_trace_rex.py — Metadata (Ghost), Network mapping (Trace), Devil's advocate (Rex)
```

## How Emergence Works

1. Scout finds suspicious domains → adds URLs to `shared_state.urls_to_investigate`
2. Veritas sees those URLs → verifies them independently
3. Ghost checks metadata on same URLs → finds they're 3 days old
4. Trace maps the network → finds 6 domains on same IP
5. Spider cross-references → finds identical content across all domains
6. Lingua detects AI text → Pattern Detector in Trace sees it's a full synthetic package
7. **Result:** Swarm collectively identified a disinformation network — no single agent had the full picture

## Kill Switch Demo

During your demo, use the frontend kill switch to disable Scout or Lingua.
The other agents continue working. Threat score may be slightly lower but converges.
This proves true non-hierarchical architecture.

## Frontend Connection

See `FRONTEND_INTEGRATION.js` for the WebSocket hook to add to Lovable.

## GitHub Structure

```
milou/
├── frontend/          ← Lovable code (push here)
│   └── src/
└── backend/           ← This folder
    ├── main.py
    ├── shared_state.py
    └── agents/
```
