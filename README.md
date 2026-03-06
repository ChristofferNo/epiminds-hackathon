# EpiMinds Hackathon

A system that maps online narratives and potential disinformation around a user-chosen topic using a network of AI agents.

## Getting Started

### Requirements

- Python 3.10+
- Node.js 18+

### Backend

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`.

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/topic` | Set the current topic |
| GET | `/context` | Get full shared context |

## Project Structure

```
project/
├── backend/
│   ├── main.py       # FastAPI app
│   └── context.py    # Shared context store
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/
├── agents/           # Agent implementations (future steps)
└── requirements.txt
```
