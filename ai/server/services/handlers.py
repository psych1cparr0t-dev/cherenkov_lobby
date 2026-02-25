"""
Intent handlers for the Symposium Socrates bot.

Each handler returns a ``CommandResponse`` dict that the widget understands.
The ``navigate`` intent is the primary addition — it resolves an LMS URL
from the course search index and returns a ``navigate_lms`` action so the
widget can redirect the student without loading full content into chat.
"""
from __future__ import annotations

from typing import Optional

from services.course_search import CourseSearchIndex


class CommandResponse(dict):
    """Thin dict subclass for clarity — serialises straight to JSON."""
    pass


# Singleton search index (populated at startup / on course load)
_search_index: Optional[CourseSearchIndex] = None


def get_search_index() -> CourseSearchIndex:
    global _search_index
    if _search_index is None:
        _search_index = CourseSearchIndex()
    return _search_index


def set_search_index(index: CourseSearchIndex) -> None:
    global _search_index
    _search_index = index


# ------------------------------------------------------------------
# Intent handlers
# ------------------------------------------------------------------

def handle_navigate(course_id: str, query: str) -> CommandResponse:
    """Resolve an LMS URL and return a ``navigate_lms`` action.

    Falls back to a text response when no matching URL is found.
    """
    index = get_search_index()
    match = index.resolve(course_id, query)

    if match:
        return CommandResponse(
            type="action",
            narration=f"Opening {match['title']}.",
            action={
                "type": "navigate_lms",
                "payload": {
                    "url": match["url"],
                    "title": match["title"],
                },
            },
        )

    return CommandResponse(
        type="text",
        narration="I couldn't find a matching page for that. Could you be more specific?",
        action=None,
    )


def handle_general(query: str) -> CommandResponse:
    """Fallback handler for unclassified intents."""
    return CommandResponse(
        type="text",
        narration="I'm not sure how to help with that yet.",
        action=None,
    )


# ------------------------------------------------------------------
# Intent routing map
# ------------------------------------------------------------------

INTENT_MAP: dict[str, callable] = {
    "navigate": handle_navigate,
    # future intents: "submit", "grade_check", "draft", ...
}


def dispatch_intent(
    intent: str,
    course_id: str,
    query: str,
) -> CommandResponse:
    """Route an intent string to its handler.

    If the intent has a dedicated handler it receives ``(course_id, query)``.
    Otherwise we fall through to ``handle_general``.
    """
    handler = INTENT_MAP.get(intent)
    if handler:
        return handler(course_id, query)
    return handle_general(query)
