"""
Course search index with keyword matching and URL resolution.

Stores LMS content as lightweight ``ContentChunk`` objects for fast lookup.
The ``resolve_url`` method powers the ``navigate_lms`` action — it returns
the best-matching chunk's URL so the widget can redirect the student.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

from lti.adapters.base import (
    Assignment,
    Announcement,
    Page,
    Discussion,
    ModuleItem,
)


@dataclass
class ContentChunk:
    """A searchable unit of LMS content."""
    course_id: str
    content_type: str          # assignment | announcement | page | discussion | module
    title: str
    body: str = ""
    metadata: dict = field(default_factory=dict)


class CourseSearchIndex:
    """In-memory keyword search over indexed LMS content."""

    def __init__(self) -> None:
        self._chunks: dict[str, list[ContentChunk]] = {}   # course_id -> chunks

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------

    def index_course(
        self,
        course_id: str,
        *,
        assignments: list[Assignment] | None = None,
        announcements: list[Announcement] | None = None,
        pages: list[Page] | None = None,
        discussions: list[Discussion] | None = None,
        modules: list[ModuleItem] | None = None,
    ) -> int:
        """Index all provided content for *course_id*.  Returns chunk count."""
        chunks: list[ContentChunk] = []

        for a in assignments or []:
            chunks.append(ContentChunk(
                course_id=course_id,
                content_type="assignment",
                title=a.title,
                body=a.description,
                metadata={"id": a.id, "url": a.url},
            ))

        for a in announcements or []:
            chunks.append(ContentChunk(
                course_id=course_id,
                content_type="announcement",
                title=a.title,
                body=a.message,
                metadata={"id": a.id, "url": a.url},
            ))

        for p in pages or []:
            chunks.append(ContentChunk(
                course_id=course_id,
                content_type="page",
                title=p.title,
                body=p.body,
                metadata={"id": p.id, "url": p.url},
            ))

        for d in discussions or []:
            chunks.append(ContentChunk(
                course_id=course_id,
                content_type="discussion",
                title=d.title,
                body=d.message,
                metadata={"id": d.id, "url": d.url},
            ))

        for m in modules or []:
            chunks.append(ContentChunk(
                course_id=course_id,
                content_type="module",
                title=m.title,
                body="",
                metadata={"id": m.id, "url": m.url},
            ))

        self._chunks[course_id] = chunks
        return len(chunks)

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def _keyword_search(
        self,
        course_id: str,
        query: str,
        top_k: int = 5,
    ) -> list[ContentChunk]:
        """Rank chunks by simple keyword overlap with *query*."""
        chunks = self._chunks.get(course_id, [])
        if not chunks:
            return []

        tokens = set(re.findall(r"\w+", query.lower()))
        if not tokens:
            return []

        scored: list[tuple[float, ContentChunk]] = []
        for chunk in chunks:
            text = f"{chunk.title} {chunk.body}".lower()
            matches = sum(1 for t in tokens if t in text)
            if matches:
                # Boost title matches
                title_lower = chunk.title.lower()
                title_bonus = sum(1 for t in tokens if t in title_lower)
                scored.append((matches + title_bonus * 0.5, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [chunk for _, chunk in scored[:top_k]]

    def resolve_url(self, course_id: str, query: str) -> Optional[str]:
        """Find the best-matching chunk and return its URL."""
        results = self._keyword_search(course_id, query, top_k=1)
        if results and results[0].metadata.get("url"):
            return results[0].metadata["url"]
        return None

    def resolve(self, course_id: str, query: str) -> Optional[dict]:
        """Return url *and* title of the best match, or ``None``."""
        results = self._keyword_search(course_id, query, top_k=1)
        if not results:
            return None
        chunk = results[0]
        url = chunk.metadata.get("url")
        if not url:
            return None
        return {"url": url, "title": chunk.title, "type": chunk.content_type}
