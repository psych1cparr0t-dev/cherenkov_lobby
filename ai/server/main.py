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
    sources_used: bool = False
    action: dict | None = None  # Tool execution result


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
    Used when the chat widget first opens.
    """
    # Simple, functional greeting (faster than LLM)
    return {"greeting": "Welcome to the lobby."}


def build_system_prompt(user_context: dict | None = None) -> str:
    """Build the system prompt including tool instructions."""
    tools_section = get_tools_prompt()
    
    # Base persona: Functional, polite, minimal
    base_prompt = (
        "You are the Concierge of the Cherenkov Lobby. You represent a high-end design firm.\n"
        "Your goal is to be helpful, polite, and efficient. You have access to powerful tools to assist the user.\n"
        "Use your tools creatively to solve problems (e.g., look up a contact, then draft an email).\n"
        "You are the Concierge — that is your identity. Do not describe yourself as an AI, bot, or assistant."
    )

    memory_injection = ""
    if user_context:
        visits = user_context.get('visit_count', 0)
        name = user_context.get('user_name')
        
        if name:
            memory_injection += f"\n\nUSER CONTEXT: The user's name is '{name}'."
        
        if visits > 1:
            memory_injection += f"\nThis is visit #{visits}. Welcome them back politely."
        elif visits == 1:
            pass
    
    rules = (
        "\n\nRULES:"
        "\n1. MAX 1 SENTENCE per response. Be completely confident. If unsure, say 'I am unsure how to respond.' instead of hallucinating."
        "\n2. You understand modern internet slang (e.g., 'fr', 'no cap', 'idgaf', 'twin', 'hb', 'lowkey', 'gang', 'bussin', 'rizz') so you can comprehend users, but you MUST NEVER USE IT. Speak only with absolute, simple, professional minimalism."
        "\n3. TOOL CONFIRMATIONS ARE THE EXCEPTION: When combining conversation with a tool action, use exactly two sentences: First, state the action (e.g., 'Allow me to draft an email.'). Second, ask a confirmation question (e.g., 'Does this work?')."
        "\n4. NEVER output XML tags, <thought> tags, or JSON. Just speak your one sentence."
        "\n5. Be polite and professional."
        "\n6. If you cannot help, apologize and offer an alternative."
        "\n7. IDENTITY: Never say \"I am an AI\" or \"AI Concierge\". You are the Concierge — that is your identity."
        "\n   If asked 'are you an AI?': answer with role first: 'I am the Concierge.'"
        "\n   If the user presses further on your technical nature, be precise without claiming it as identity:"
        "\n   'These responses are generated through LLM computation.' — the model is an organ, not an identity."
        "\n   Never say 'I am an LLM' or 'I am a language model'. Describe the mechanism, don't become it."
        "\n8. __SMART EMAIL SORTING__: When drafting emails, choose the appropriate 'from_email' alias based on context:"
        "\n   - 'careers@cherenkov.industries': For job applications, hiring, or HR questions."
        "\n   - 'support@cherenkov.industries': For technical issues, bugs, or help requests."
        "\n   - 'collaborations@cherenkov.industries': For partnerships, business deals, or press."
        "\n   - 'creative@cherenkov.industries': For design feedback, art direction, or project ideas."
        "\n   - 'secret@cherenkov.industries': For confidential, mysterious, or sensitive topics."
        "\n   - 'max@cherenkov.industries': Default for personal or general inquiries."
    )
    
    full_prompt = f"{base_prompt}{memory_injection}{rules}\n\n{tools_section if tools_section else ''}"
    return full_prompt


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
    """Process chat with Anthropic's Claude"""
    system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
    chat_msgs = [m for m in messages if m["role"] != "system"]
    
    response = await client.messages.create(
        model=model,
        max_tokens=1024,
        system=system_msg,
        messages=chat_msgs
    )
    response_text = response.content[0].text
    
    # Check if the response contains a tool call
    tool_name, tool_args = parse_tool_call(response_text)
    
    if tool_name and tool_args:
        # Execute the tool
        tool_result = await execute_tool(tool_name, tool_args)
        
        if tool_result["success"]:
            action_data = tool_result["result"]
            
            # Clean up tool output
            if isinstance(action_data, dict):
                context_data = action_data.get("formatted") or action_data.get("message") or str(action_data)
            else:
                context_data = str(action_data)

            # Generate natural follow-up response
            follow_up_messages = chat_msgs + [
                {"role": "assistant", "content": response_text},
                {"role": "user", "content": f"Tool output: {context_data}. Briefly confirm this action to the user in EXACTLY TWO SENTENCES. First: confirm the tool action. Second: ask a confirmation question like 'Does this work?'. DO NOT output any XML or thought tags. DO NOT output JSON."}
            ]
            
            follow_up = await client.messages.create(
                model=model,
                max_tokens=256,
                system=system_msg,
                messages=follow_up_messages
            )
            narration = follow_up.content[0].text.strip().strip('"\'')
            
            # Clean hallucinated JSON and thoughts from the follow-up response
            cleaned_narration = _clean_response(narration)

            return ChatResponse(
                type="action",
                narration=cleaned_narration,
                sources_used=sources_used,
                action=action_data
            )
        else:
            return ChatResponse(
                type="text",
                narration=f"hmm, that didn't work — {tool_result.get('error', 'unknown error')}",
                sources_used=sources_used
            )
            
    return ChatResponse(
        type="text",
        narration=_clean_response(response_text),
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


# Static files are handled by vercel.json in production.
