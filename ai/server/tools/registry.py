"""
Tool Registry — Manages available tools and their schemas for LLM function calling.
"""
from typing import Callable, Any
import json


# Tool registry: name -> (function, schema)
TOOL_REGISTRY: dict[str, tuple[Callable, dict]] = {}


def register_tool(name: str, description: str, parameters: dict):
    """Decorator to register a tool with its JSON schema."""
    def decorator(func: Callable) -> Callable:
        schema = {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": parameters
            }
        }
        TOOL_REGISTRY[name] = (func, schema)
        return func
    return decorator


def get_tool_schemas() -> list[dict]:
    """Get all tool schemas for the LLM system prompt."""
    return [schema for _, schema in TOOL_REGISTRY.values()]


def get_tools_prompt() -> str:
    """Generate a tools description for the system prompt."""
    tools = get_tool_schemas()
    if not tools:
        return ""
    
    lines = ["You have access to the following tools. To use a tool, respond with a JSON object in this exact format:",
             '{"tool": "tool_name", "args": {"param1": "value1"}}',
             "",
             "Available tools:"]
    
    for tool in tools:
        func = tool["function"]
        lines.append(f"\n### {func['name']}")
        lines.append(func["description"])
        if func.get("parameters", {}).get("properties"):
            lines.append("Parameters:")
            for param, details in func["parameters"]["properties"].items():
                required = param in func["parameters"].get("required", [])
                req_str = " (required)" if required else " (optional)"
                lines.append(f"  - {param}{req_str}: {details.get('description', details.get('type', 'any'))}")
    
    lines.append("\nIf you don't need to use a tool, just respond normally with text.")
    return "\n".join(lines)


async def execute_tool(tool_name: str, args: dict) -> dict[str, Any]:
    """Execute a tool by name with given arguments."""
    if tool_name not in TOOL_REGISTRY:
        return {"success": False, "error": f"Unknown tool: {tool_name}"}
    
    func, _ = TOOL_REGISTRY[tool_name]
    try:
        # Check if function is async
        import asyncio
        if asyncio.iscoroutinefunction(func):
            result = await func(**args)
        else:
            result = func(**args)
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


def parse_tool_call(response_text: str) -> tuple[str | None, dict | None]:
    """
    Try to extract a tool call from the LLM response.
    Returns (tool_name, args) or (None, None) if no tool call found.
    """
    # Look for JSON object in the response
    text = response_text.strip()
    
    # Try to find JSON block
    start_idx = text.find("{")
    if start_idx == -1:
        return None, None
    
    # Find matching closing brace
    depth = 0
    end_idx = start_idx
    for i, char in enumerate(text[start_idx:], start_idx):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end_idx = i + 1
                break
    
    if depth != 0:
        return None, None
    
    try:
        json_str = text[start_idx:end_idx]
        data = json.loads(json_str)
        
        if "tool" in data and "args" in data:
            return data["tool"], data["args"]
        
    except json.JSONDecodeError:
        pass
    
    return None, None
