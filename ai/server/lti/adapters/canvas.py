"""
Canvas LMS adapter.

Canvas objects expose ``html_url`` on most resources.
Pages are an exception — we construct the URL from the course id and page slug.
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


class CanvasAdapter(BaseLMSAdapter):
    """Adapter for the Canvas REST API (v1)."""

    # -- helpers ----------------------------------------------------------

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.access_token}"}

    async def _get(self, path: str) -> list[dict[str, Any]]:
        url = f"{self.base_url}/api/v1{path}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._headers())
            resp.raise_for_status()
            data = resp.json()
            return data if isinstance(data, list) else [data]

    # -- public API -------------------------------------------------------

    async def get_assignments(self, course_id: str) -> list[Assignment]:
        items = await self._get(f"/courses/{course_id}/assignments")
        return [
            Assignment(
                id=str(a["id"]),
                title=a.get("name", ""),
                description=a.get("description", "") or "",
                due_date=_parse_dt(a.get("due_at")),
                points_possible=a.get("points_possible"),
                url=a.get("html_url"),
            )
            for a in items
        ]

    async def get_announcements(self, course_id: str) -> list[Announcement]:
        items = await self._get(
            f"/courses/{course_id}/discussion_topics?only_announcements=true"
        )
        return [
            Announcement(
                id=str(a["id"]),
                title=a.get("title", ""),
                message=a.get("message", "") or "",
                posted_at=_parse_dt(a.get("posted_at")),
                url=a.get("html_url"),
            )
            for a in items
        ]

    async def get_pages(self, course_id: str) -> list[Page]:
        items = await self._get(f"/courses/{course_id}/pages")
        return [
            Page(
                id=str(p.get("page_id", p.get("url", ""))),
                title=p.get("title", ""),
                body=p.get("body", "") or "",
                updated_at=_parse_dt(p.get("updated_at")),
                url=f"{self.base_url}/courses/{course_id}/pages/{p.get('url', '')}",
            )
            for p in items
        ]

    async def get_discussions(self, course_id: str) -> list[Discussion]:
        items = await self._get(f"/courses/{course_id}/discussion_topics")
        return [
            Discussion(
                id=str(d["id"]),
                title=d.get("title", ""),
                message=d.get("message", "") or "",
                posted_at=_parse_dt(d.get("posted_at")),
                url=d.get("html_url"),
            )
            for d in items
        ]

    async def get_modules(self, course_id: str) -> list[ModuleItem]:
        items = await self._get(f"/courses/{course_id}/modules?include[]=items")
        results: list[ModuleItem] = []
        for mod in items:
            for item in mod.get("items", []):
                results.append(
                    ModuleItem(
                        id=str(item["id"]),
                        title=item.get("title", ""),
                        item_type=item.get("type", ""),
                        url=item.get("html_url"),
                    )
                )
        return results

    async def get_course_info(self, course_id: str) -> CourseInfo:
        data = (await self._get(f"/courses/{course_id}"))[0]
        return CourseInfo(
            id=str(data["id"]),
            name=data.get("name", ""),
            code=data.get("course_code", ""),
            term=data.get("term", {}).get("name", "") if isinstance(data.get("term"), dict) else "",
        )
