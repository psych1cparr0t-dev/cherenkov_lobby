#!/bin/bash
# Cherenkov Homepage Startup Script
#
# This script starts the dual-model AI concierge system:
# - llama3.2:3b (concierge-3b) for text conversations
# - llama3.1:8b (concierge) for API/tool execution

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/ai/server"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Cherenkov Homepage Startup${NC}"
echo -e "${BLUE}================================${NC}"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Warning: Ollama not found. Please install from https://ollama.ai${NC}"
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo -e "${YELLOW}Starting Ollama server...${NC}"
    ollama serve &
    sleep 3
fi

# Check/create models
echo -e "\n${GREEN}Checking models...${NC}"

# Check if concierge-3b exists
if ! ollama list | grep -q "concierge-3b"; then
    echo -e "${YELLOW}Creating concierge-3b model (llama3.2:3b)...${NC}"
    ollama create concierge-3b -f "$SCRIPT_DIR/ai/modelfiles/Concierge3B.modelfile"
else
    echo -e "  ${GREEN}✓${NC} concierge-3b (text chat)"
fi

# Check if concierge (8b) exists
if ! ollama list | grep -q "concierge:latest"; then
    echo -e "${YELLOW}Creating concierge model (llama3.1:8b)...${NC}"
    echo -e "${YELLOW}Note: This requires ~5GB and may take a moment to download${NC}"
    ollama create concierge -f "$SCRIPT_DIR/ai/modelfiles/Concierge.modelfile"
else
    echo -e "  ${GREEN}✓${NC} concierge (API/tools - 8b)"
fi

# Start the API server
echo -e "\n${GREEN}Starting API server...${NC}"
cd "$SERVER_DIR"

# Check if virtual environment exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install dependencies if needed
if ! python3 -c "import fastapi" &> /dev/null; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip3 install -r requirements.txt
fi

# Start the server
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}  System Ready!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e ""
echo -e "  API Server: ${BLUE}http://localhost:8000${NC}"
echo -e "  Health:     ${BLUE}http://localhost:8000/health${NC}"
echo -e ""
echo -e "  Models:"
echo -e "    ${GREEN}•${NC} concierge-3b  → text conversations"
echo -e "    ${GREEN}•${NC} concierge     → API/tool execution"
echo -e ""
echo -e "  Open ${BLUE}index.html${NC} in your browser to use the concierge."
echo -e ""

python3 main.py
