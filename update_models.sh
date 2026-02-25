#!/bin/bash
# Update Ollama models with latest Modelfiles

# Ensure we are in the project root
cd "$(dirname "$0")"

echo "✦ Updating 'concierge' (8B)..."
ollama create concierge -f ai/modelfiles/Concierge.modelfile

echo "✦ Updating 'concierge-3b' (3B)..."
ollama create concierge-3b -f ai/modelfiles/Concierge3B.modelfile

echo "✦ Models updated successfully."
