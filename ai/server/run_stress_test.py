import json
import re
import requests
import time
import asyncio

PROMPTS_FILE = "../concierge_stress_test_prompts.md"
API_URL = "http://localhost:8000/chat"

def get_prompts():
    prompts = []
    with open(PROMPTS_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if len(line) > 2 and line[0].isdigit():
                parts = line.split(". ", 1)
                if len(parts) == 2:
                    prompt_text = parts[1].strip()
                    if '" (' in prompt_text:
                        prompt_text = prompt_text.split('" (')[0] + '"'
                    if prompt_text.startswith('"') and prompt_text.endswith('"'):
                        prompt_text = prompt_text[1:-1]
                    prompts.append(prompt_text)
    return prompts

def send_prompt(prompt):
    payload = {
        "message": prompt,
        "conversation_history": [],
        "user_context": {}
    }
    try:
        start_time = time.time()
        resp = requests.post(API_URL, json=payload, timeout=60)
        elapsed = time.time() - start_time
        if resp.ok:
            data = resp.json()
            tool_used = "Yes" if data.get("type") == "action" else "No"
            print(f"[✓] ({elapsed:.2f}s) Prompt: '{prompt[:50]}...' -> Tool: {tool_used}")
        else:
            print(f"[x] Error {resp.status_code} for prompt: {prompt[:50]}...")
    except Exception as e:
        print(f"[!] Request failed for prompt: {prompt[:50]}... ({e})")

def main():
    prompts = get_prompts()
    print(f"Loaded {len(prompts)} prompts. Starting stress test...")
    for idx, p in enumerate(prompts):
        print(f"--- Prompt {idx+1}/{len(prompts)} ---")
        send_prompt(p)
        time.sleep(1) # Be nice to the API/Ollama
    print("Stress test complete.")

if __name__ == "__main__":
    main()
