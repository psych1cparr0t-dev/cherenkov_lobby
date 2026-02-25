"""
Blackboard Learn (Ultra) adapter.

Blackboard rarely exposes direct ``html_url`` fields; instead we construct
Ultra-experience URLs from known path patterns.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from .base import (
    BaseLMSAdapter,
    Assignment,
    Announcement,
    Page,
    Discussion,
    ModuleItem,
    CourseInfo,
)


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


class BlackboardAdapter(BaseLMSAdapter):
    """Adapter for the Blackboard Learn REST API (v3)."""

    # -- helpers ----------------------------------------------------------

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.access_token}"}

    async def _get(self, path: str) -> list[dict[str, Any]]:
        url = f"{self.base_url}/learn/api/public/v3{path}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._headers())
            resp.raise_for_status()
            data = resp.json()
            return data.get("results", [data]) if isinstance(data, dict) else data

    # -- public API -------------------------------------------------------

    async def get_assignments(self, course_id: str) -> list[Assignment]:
        items = await self._get(f"/courses/{course_id}/contents?contentHandler=resource/x-bb-assignment")
        return [
            Assignment(
                id=str(a["id"]),
                title=a.get("title", ""),
                description=a.get("body", "") or "",
                due_date=_parse_dt(a.get("availability", {}).get("adaptiveRelease", {}).get("end")),
                points_possible=a.get("grading", {}).get("points") if isinstance(a.get("grading"), dict) else None,
                url=f"{self.base_url}/ultra/courses/{course_id}/outline/assessment/{a['id']}",
            )
            for a in items
        ]

    async def get_announcements(self, course_id: str) -> list[Announcement]:
        items = await self._get(f"/courses/{course_id}/announcements")
        return [
            Announcement(
                id=str(a["id"]),
                title=a.get("title", ""),
                message=a.get("body", "") or "",
                posted_at=_parse_dt(a.get("created")),
                url=f"{self.base_url}/ultra/courses/{course_id}/announcements",
            )
            for a in items
        ]

    async def get_pages(self, course_id: str) -> list[Page]:
        items = await self._get(f"/courses/{course_id}/contents")
        return [
            Page(
                id=str(p["id"]),
                title=p.get("title", ""),
                body=p.get("body", "") or "",
                updated_at=_parse_dt(p.get("modified")),
                url=f"{self.base_url}/ultra/courses/{course_id}/outline/edit/{p['id']}",
            )
            for p in items
            if p.get("contentHandler", {}).get("id") == "resource/x-bb-document"
        ]

    async def get_discussions(self, course_id: str) -> list[Discussion]:
        items = await self._get(f"/courses/{course_id}/discussions")
        return [
            Discussion(
                id=str(d["id"]),
                title=d.get("title", ""),
                message=d.get("body", "") or "",
                posted_at=_parse_dt(d.get("created")),
                url=f"{self.base_url}/ultra/courses/{course_id}/discussions",
            )
            for d in items
        ]

    async def get_modules(self, course_id: str) -> list[ModuleItem]:
        items = await self._get(f"/courses/{course_id}/contents")
        return [
            ModuleItem(
                id=str(c["id"]),
                title=c.get("title", ""),
                item_type=c.get("contentHandler", {}).get("id", ""),
                url=f"{self.base_url}/ultra/courses/{course_id}/outline/edit/{c['id']}",
            )
            for c in items
        ]

    async def get_course_info(self, course_id: str) -> CourseInfo:
        data = (await self._get(f"/courses/{course_id}"))[0]
        return CourseInfo(
            id=str(data.get("id", course_id)),
            name=data.get("name", ""),
            code=data.get("courseId", ""),
            term=data.get("termId", ""),
        )
