"""
Cherenkov AI API Server.
Provides chat endpoints for the website's Concierge widget.
Now with function calling for tools (email, calendar, navigation, etc.)
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Any


import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic

from config import (
    CORS_ORIGINS, API_HOST, API_PORT, ANTHROPIC_API_KEY, CLAUDE_MODEL
)
from rag_pipeline import get_pipeline
from tools import get_tools_prompt, parse_tool_call, execute_tool, TOOL_REGISTRY


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup."""
    # Initialize RAG pipeline
    get_pipeline()
    # Log available tools and models
    print(f"Cherenkov AI Server starting on {API_HOST}:{API_PORT}")
    print(f"Using Cloud Model: {CLAUDE_MODEL}")
    print(f"Loaded {len(TOOL_REGISTRY)} tools: {', '.join(TOOL_REGISTRY.keys())}")
    yield


app = FastAPI(
    title="Cherenkov AI Concierge",
    description="AI-powered concierge for Cherenkov design firm",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS for website access
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str
    conversation_history: list[dict] = []
    user_context: dict | None = None  # New field for memory persistence


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    type: str = "text"
    narration: str = ""
    intent_key: str = "text"
    sources_used: bool = False
    action: dict | None = None  # Tool execution result


class EscalateRequest(BaseModel):
    """Request model for escalation endpoint."""
    transcript: list[dict] = []
    timestamp: str = ""


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model": CLAUDE_MODEL,
        "tools_loaded": len(TOOL_REGISTRY),
        "tools": list(TOOL_REGISTRY.keys())
    }


@app.get("/greeting")
async def get_greeting():
    """
    Generate a random greeting from the Concierge.
    Kept for backwards compatibility — client now uses card lookup instead.
    """
    return {"greeting": "Welcome To Cherenkov."}


@app.post("/escalate")
async def escalate(payload: EscalateRequest):
    """
    Escalation endpoint — called after 3 consecutive fallback strikes.
    Sends a transcript email to the owner via Resend, then client redirects visitor.
    """
    from config import RESEND_API_KEY, EMAIL_FROM, EMAIL_TO_DEFAULT

    if not RESEND_API_KEY:
        print("[Escalate] RESEND_API_KEY not set — skipping email")
        return {"status": "notified"}

    try:
        import resend
        resend.api_key = RESEND_API_KEY

        transcript_lines = []
        for msg in payload.transcript:
            role = msg.get("role", "?").upper()
            content = msg.get("content", "")
            transcript_lines.append(f"{role}: {content}")

        body = (
            f"Cherenkov Concierge Escalation\n"
            f"Timestamp: {payload.timestamp}\n\n"
            f"Conversation Transcript:\n"
            f"{'—' * 40}\n"
            + "\n".join(transcript_lines)
            + f"\n{'—' * 40}\n\n"
            f"Visitor was redirected to the Three.js sandbox after 3 unclassified queries."
        )

        resend.Emails.send({
            "from": EMAIL_FROM,
            "to": EMAIL_TO_DEFAULT,
            "subject": "Cherenkov Concierge Escalation",
            "text": body
        })
        print(f"[Escalate] Notification sent to {EMAIL_TO_DEFAULT}")
    except Exception as e:
        print(f"[Escalate] Email failed: {e}")

    return {"status": "notified"}


def build_system_prompt(user_context: dict | None = None) -> str:
    """Build the classifier-only system prompt."""
    return (
        "You are a concierge intent classifier for Cherenkov, a high-end design firm. "
        "Respond ONLY with a JSON object — no prose, no explanation, no extra keys.\n\n"
        "Format: {\"intent\": \"<key>\", \"tool\": \"<tool_name_or_null>\", \"args\": {}}\n\n"
        "Intent keys:\n"
        "  identity         — who is Cherenkov, what are you\n"
        "  services         — what work / disciplines\n"
        "  portfolio        — show me your work, examples, past projects\n"
        "  contact          — reach the team, send a message, inquiry\n"
        "  pricing          — cost, rates, budget, fees\n"
        "  process          — how do you work, workflow, timeline\n"
        "  qualification    — are you right for my project, fit\n"
        "  scope_limit      — legal, hiring, press, irrelevant topics\n"
        "  pleasantries     — greetings, thanks, compliments, goodbye\n"
        "  repeat_browsing  — no clear ask, vague, browsing\n"
        "  philosophical    — meta, existential, weird, off-lane\n"
        "  fallback         — cannot classify confidently\n\n"
        "Tool keys (include only when intent clearly requires an action):\n"
        "  navigate_to            — portfolio intent → navigate to portfolio page\n"
        "  send_contact_message   — contact intent with name + email provided\n"
        "  get_availability       — scheduling / calendar request\n"
        "  create_calendar_event  — explicit event booking\n"
        "  get_projects           — request for specific project list\n\n"
        "If a tool is needed, populate args with the required parameters. "
        "If no tool is needed, set tool to null and args to {}.\n"
        "Never generate natural language. Return only the JSON object."
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat message and return a response from the Concierge.
    Routes to 3B for text chat, 8B for tool/action requests.
    """
    pipeline = get_pipeline()
    
    # Build the messages list with system prompt (now with context)
    messages = [{"role": "system", "content": build_system_prompt(request.user_context)}]
    
    # Context retrieval (SKIP for short messages to reduce latency)
    context_prompt = ""
    sources_used = False
    
    if len(request.message) > 10:
        context_prompt = pipeline.get_context_prompt(request.message)
        sources_used = bool(context_prompt)
    else:
        print(f"[RAG] Skipping context for short message: '{request.message}'")
    
    # Add conversation history
    for msg in request.conversation_history[-10:]:
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })
    
    # Add current message with context
    user_content = f"{context_prompt}USER QUESTION: {request.message}" if context_prompt else request.message
    messages.append({"role": "user", "content": user_content})
    
    # Route to appropriate model based on intent
    result = await _route_chat_to_model(request.message, messages, sources_used)
    return result


def _looks_like_action_request(message: str) -> bool:
    """
    Check if the message looks like it needs a tool/action.
    Returns True if message mentions navigation, scheduling, emailing, etc.
    """
    action_keywords = [
        # Navigation
        "go to", "take me", "show me", "navigate", "open", "portfolio", "about", "contact", "showcase",
        # Calendar/scheduling
        "schedule", "book", "meeting", "available", "availability", "calendar", "appointment", "free time",
        # Email/messaging
        "email", "send", "message", "contact them", "reach out",
        # Projects/database
        "project", "projects", "client", "lookup", "find"
    ]
    
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in action_keywords)


async def _route_chat_to_model(user_message: str, messages: list, sources_used: bool) -> ChatResponse:
    """
    Route directly to Anthropic.
    """
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not configured")
        
    client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    print(f"[Router] Cloud Backend → using {CLAUDE_MODEL}")
    try:
        return await _process_chat_with_anthropic(client, CLAUDE_MODEL, messages, sources_used)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"Anthropic error: {str(e)}")

async def _process_chat_with_anthropic(
    client: Any,
    model: str,
    messages: list,
    sources_used: bool
) -> ChatResponse:
    """Process chat with Anthropic's Claude (classifier mode)."""
    import json as _json

    system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
    chat_msgs = [m for m in messages if m["role"] != "system"]

    response = await client.messages.create(
        model=model,
        max_tokens=256,
        system=system_msg,
        messages=chat_msgs
    )
    response_text = response.content[0].text.strip()

    # --- Parse classifier JSON ---
    intent_key = "fallback"
    tool_name_from_classifier = None
    tool_args_from_classifier = {}

    try:
        # Strip any thought/reasoning wrappers if model adds them
        clean_text = re.sub(r'<think>.*?</think>', '', response_text, flags=re.DOTALL).strip()
        classifier_data = _json.loads(clean_text)
        intent_key = classifier_data.get("intent", "fallback")
        tool_name_from_classifier = classifier_data.get("tool") or None
        tool_args_from_classifier = classifier_data.get("args") or {}
    except Exception:
        print(f"[Classifier] Failed to parse JSON: {response_text!r}")
        intent_key = "fallback"

    print(f"[Classifier] intent={intent_key!r} tool={tool_name_from_classifier!r}")

    # --- Execute tool if classifier specified one ---
    if tool_name_from_classifier and tool_name_from_classifier in TOOL_REGISTRY:
        tool_result = await execute_tool(tool_name_from_classifier, tool_args_from_classifier)

        if tool_result["success"]:
            action_data = tool_result["result"]
            return ChatResponse(
                type="action",
                narration="",
                intent_key=intent_key,
                sources_used=sources_used,
                action=action_data
            )
        else:
            # Tool failed — return the intent key so client can still show the card
            return ChatResponse(
                type="text",
                narration="",
                intent_key=intent_key,
                sources_used=sources_used
            )

    return ChatResponse(
        type="text",
        narration="",
        intent_key=intent_key,
        sources_used=sources_used
    )

import re

def _clean_response(text: str) -> str:
    """If the model prepends JSON or thought blocks to its response, strip them out."""
    text = text.strip()
    
    # Strip thought blocks (the Mind Palace)
    text = re.sub(r'<thought>.*?</thought>', '', text, flags=re.DOTALL)
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = text.strip()

    if text.startswith("{"):
        # The model may have hallucinated {"tool":...} before the text
        # Let's find where the JSON ends
        depth = 0
        end_idx = 0
        for i, char in enumerate(text):
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    end_idx = i + 1
                    break
        
        if end_idx > 0 and end_idx < len(text):
            # It found a valid JSON block, return the text after it
            return text[end_idx:].strip().strip('"\'')
            
    return text.strip().strip('"\'')



@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream a chat response from the Concierge.
    Note: Streaming does not support tool execution (tools are executed in /chat).
    """
    pipeline = get_pipeline()
    context_prompt = pipeline.get_context_prompt(request.message)
    
    messages = [{"role": "system", "content": build_system_prompt()}]
    
    for msg in request.conversation_history[-10:]:
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })
    
    user_content = f"{context_prompt}USER QUESTION: {request.message}" if context_prompt else request.message
    messages.append({"role": "user", "content": user_content})
    
    async def generate() -> AsyncGenerator[str, None]:
        try:
            if not ANTHROPIC_API_KEY:
                yield "data: [ERROR] ANTHROPIC_API_KEY is not configured\n\n"
                return

            client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
            system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
            chat_msgs = [m for m in messages if m["role"] != "system"]
            
            stream = await client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=1024,
                system=system_msg,
                messages=chat_msgs,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.type == "content_block_delta" and hasattr(chunk.delta, 'text'):
                    yield f"data: {chunk.delta.text}\n\n"
                elif chunk.type == "message_stop":
                    yield "data: [DONE]\n\n"
            
        except Exception as e:
            traceback.print_exc()
            yield f"data: [ERROR] {str(e)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/tools")
async def list_tools():
    """List all available tools for debugging."""
    from tools import get_tool_schemas
    return {
        "count": len(TOOL_REGISTRY),
        "tools": get_tool_schemas()
    }


# --- Static File Serving ---
# Placed at the end to ensure API routes take precedence
from fastapi.staticfiles import StaticFiles
import os

# Mount the project root directory (cherenkov_homepage) to serve index.html and models
# We go up two levels from ai/server/main.py
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))

# Mount root to "/" to serve index.html as fallback
app.mount("/", StaticFiles(directory=project_root, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)
