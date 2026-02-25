#!/bin/bash
# ===========================================
# Cherenkov AI Setup Script
# ===========================================

set -e

echo "========================================"
echo "Cherenkov AI Concierge - Setup"
echo "========================================"
echo ""

# Check for Ollama
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Installing..."
    echo "   Run: brew install ollama"
    echo "   Then run this script again."
    exit 1
fi

echo "✓ Ollama found"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
    echo "⚠ Ollama is not running. Starting..."
    ollama serve &
    sleep 3
fi

echo "✓ Ollama is running"

# Pull Mistral model if not present
echo ""
echo "Checking for Mistral 7B model..."
if ! ollama list | grep -q "mistral:7b"; then
    echo "   Pulling mistral:7b (this may take a while)..."
    ollama pull mistral:7b
fi

echo "✓ Mistral 7B available"

# Create custom Concierge model
echo ""
echo "Creating Concierge model..."
cd "$(dirname "$0")/.."
ollama create concierge -f ai/modelfiles/Concierge.modelfile

echo "✓ Concierge model created"

# Setup Python environment
echo ""
echo "Setting up Python environment..."
cd ai/server

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

echo "✓ Python dependencies installed"

# Ingest knowledge base
echo ""
echo "Ingesting knowledge base..."
python ingest.py

echo ""
echo "========================================"
echo "✓ Setup Complete!"
echo "========================================"
echo ""
echo "To start the server:"
echo "  cd ai/server"
echo "  source .venv/bin/activate"
echo "  python main.py"
echo ""
echo "Then open index.html in your browser."
echo ""
