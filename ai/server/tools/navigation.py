"""
Navigation Tool — Commands for opening website pages.
"""
from .registry import register_tool


# Available pages on the Cherenkov website
PAGES = {
    "home": {"path": "/", "description": "Homepage"},
    "portfolio": {"path": "/portfolio", "description": "Design portfolio and project showcase"},
    "about": {"path": "/about", "description": "About Cherenkov and the team"},
    "contact": {"path": "/contact", "description": "Contact information and form"},
    "showcase": {"path": "/showcase", "description": "Interactive showcase experiments"},
}


def get_available_pages() -> dict:
    """Return available pages for navigation."""
    return PAGES


@register_tool(
    name="navigate_to",
    description="Open a page on the Cherenkov website in a new browser tab. Use this when the user asks to see a specific section like portfolio, about, or contact.",
    parameters={
        "type": "object",
        "properties": {
            "page": {
                "type": "string",
                "description": "The page to navigate to (home, portfolio, about, contact, showcase)",
                "enum": list(PAGES.keys())
            }
        },
        "required": ["page"]
    }
)
def navigate_to(page: str) -> dict:
    """Navigate to a specific page on the website."""
    if page not in PAGES:
        return {
            "action": "error",
            "message": f"Unknown page: {page}. Available: {', '.join(PAGES.keys())}"
        }
    
    page_info = PAGES[page]
    return {
        "action": "navigate",
        "url": page_info["path"],
        "page_name": page,
        "description": page_info["description"]
    }


@register_tool(
    name="list_pages",
    description="List all available pages on the Cherenkov website. Use this when the user asks what sections exist or wants to know what they can explore.",
    parameters={
        "type": "object",
        "properties": {},
        "required": []
    }
)
def list_pages() -> dict:
    """List all available website pages."""
    pages_list = [
        f"- **{name}**: {info['description']}"
        for name, info in PAGES.items()
    ]
    return {
        "action": "info",
        "pages": PAGES,
        "formatted": "\n".join(pages_list)
    }
