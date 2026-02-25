# Cherenkov Homepage

AI-powered concierge website with dual-model architecture.

## Quick Start

```bash
./start.sh
```

Then open `index.html` in your browser.

## Architecture

### Dual-Model System

| Model | Base | Purpose | Auto-Routes When |
|-------|------|---------|------------------|
| `concierge-3b` | llama3.2:3b | Text conversations | Default for chat |
| `concierge` | llama3.3:70b | API/tool execution | Navigation, scheduling, email keywords |

The routing logic automatically selects the appropriate model:
- **3B (fast)** → Greetings, questions, general conversation
- **70B (powerful)** → "schedule", "navigate", "email", "project" requests

### Project Structure

```
cherenkov_homepage/
├── index.html              # Main landing page
├── start.sh                # Startup script (runs everything)
├── ai/
│   ├── modelfiles/         # Ollama model definitions
│   │   ├── Concierge.modelfile      # 70B for tools
│   │   └── Concierge3B.modelfile    # 3B for chat
│   └── server/
│       ├── main.py         # FastAPI server with routing
│       ├── config.py       # Configuration
│       ├── rag_pipeline.py # Knowledge base retrieval
│       ├── tools/          # Tool implementations
│       └── .env            # API keys (not in git)
├── knowledge/              # RAG knowledge base (markdown files)
├── styles/                 # CSS
├── scripts/                # Client-side JS
├── images/                 # Assets
├── logos/                  # Logo files
├── models/                 # 3D GLB files
├── showcase/               # Showcase pages
├── patroclus_current_draft/ # Development prototypes
└── archive/                # Legacy files
```

## Configuration

Edit `ai/server/.env`:

```env
# Models (already configured)
OLLAMA_MODEL_PRIMARY=concierge-3b    # Fast text chat
OLLAMA_MODEL_FALLBACK=concierge      # Powerful API/tools

# Optional integrations
RESEND_API_KEY=...          # Email
AIRTABLE_API_KEY=...        # Project database
GOOGLE_CREDENTIALS_PATH=... # Calendar
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/greeting` | GET | Generate random greeting |
| `/chat` | POST | Main chat (auto-routes to 3B or 70B) |
| `/chat/stream` | POST | Streaming chat |
| `/tools` | GET | List available tools |

## Available Tools (70B only)

- `navigate_to` - Website navigation
- `list_pages` - Available sections
- `get_availability` - Calendar lookup
- `create_calendar_event` - Schedule meetings
- `send_contact_message` - Email via Resend
- `get_projects` - Airtable query

## Development

The `patroclus_current_draft/` folder contains experimental features:
- Whale animation system
- Portal UI prototypes
- Felix 3D character system
- SPA navigation experiments

## Requirements

- Python 3.10+
- Ollama (with ~45GB for both models)
- Node.js (optional, for Felix)
