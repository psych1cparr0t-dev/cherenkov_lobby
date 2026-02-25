# Cherenkov AI Concierge

A local AI-powered concierge for the Cherenkov website, using Ollama + RAG.

## Quick Start

```bash
# Run the setup script
chmod +x ai/scripts/setup.sh
./ai/scripts/setup.sh

# Start the server
cd ai/server
source .venv/bin/activate
python main.py
```

Then open `index.html` in your browser. The chat widget appears in the bottom-right corner.

## Architecture

```
ai/
├── modelfiles/          # Ollama model definitions
│   └── Concierge.modelfile
├── scripts/             # Setup and utility scripts
│   └── setup.sh
└── server/              # Python RAG backend
    ├── main.py          # FastAPI server
    ├── rag_pipeline.py  # Document retrieval
    ├── config.py        # Settings
    └── ingest.py        # Knowledge ingestion

knowledge/               # Knowledge base (add your content here)
├── company/             # Company info, policies
├── designs/             # Portfolio descriptions
├── literature/          # Reference literature
└── history/             # Historical context
```

## Adding Knowledge

1. Add markdown files to `knowledge/`
2. Run `python ingest.py` to update embeddings
3. Restart the server

## API Endpoints

- `GET /health` — Health check
- `POST /chat` — Send a message, get a response
- `POST /chat/stream` — Streaming response (SSE)

## Configuration

Edit `ai/server/config.py` to change:
- `OLLAMA_MODEL` — Which model to use
- `OLLAMA_HOST` — Ollama server URL
- `API_PORT` — Server port
