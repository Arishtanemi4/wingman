# Wingman

Wingman is an AI-powered dating coach that simulates realistic matches and gives actionable feedback on your dating profile. It generates a pool of 108 AI personas spanning 12 personality archetypes — each with distinct texting behaviors, attraction thresholds, and conversational patterns derived from behavioral psychology. You can practice real conversations with these simulated personas, which dynamically adjust their warmth and engagement based on message quality, just like a real match would. A vision-enhanced LLM pipeline scores your photos and analyzes your bio, hobbies, and occupation against each archetype to surface concrete improvement areas. The result is a closed-loop training environment where you can identify gaps, iterate, and see measurable change in how different personality types respond to you.

---

## Setup

### Backend (Conda / Python)

Requires [Anaconda](https://www.anaconda.com/download) or Miniconda.

```bash
# Create and activate the environment
conda env create -f backend/environment.yaml
conda activate wingman

# Copy and configure environment variables
cp backend/.env.example backend/.env
# Set NVIDIA_API_KEY (and optionally VISION_API_KEY, VISION_MODEL) in backend/.env

# Start the API server
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend (Node / npm)

Requires [Node.js](https://nodejs.org/) 18+.

```bash
cd frontend
npm install
npm run dev
```

The React app will be available at `http://localhost:5173` by default.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NVIDIA_API_KEY` | API key for NVIDIA NIM (text + vision models) | required |
| `VISION_BASE_URL` | Base URL for the vision model endpoint | NVIDIA NIM |
| `VISION_MODEL` | Vision model ID | `meta/llama-3.2-11b-vision-instruct` |
| `CHAT_TEMPERATURE` | Sampling temperature for persona chat | `0.9` |
| `CHAT_MAX_TOKENS` | Max tokens per persona reply | `150` |

---

## Project Structure

```
wingman/
├── backend/
│   ├── main.py              # FastAPI entrypoint
│   ├── llm.py               # LLM client wrapper
│   ├── agents/              # Persona simulation logic
│   ├── routes/              # API route handlers
│   ├── gen/                 # Persona generation scripts & fragments
│   ├── environment.yaml     # Conda environment spec
│   └── requirements.txt     # pip dependencies
└── frontend/                # React application
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Profile analysis against all 12 archetypes |
| `POST` | `/api/archetypes/insights` | Per-archetype pros/cons breakdown |
| `POST` | `/api/evaluate` | Conversation evaluation and scoring |
| `GET` | `/api/personas` | List available AI personas |
| `POST` | `/api/personas/{id}/chat` | Chat with a specific persona |
| `GET` | `/api/models` | List available LLM models |

---

## License

MIT
