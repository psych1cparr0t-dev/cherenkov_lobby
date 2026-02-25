"""
Brightspace (D2L) adapter.

Brightspace URLs are constructable from known path patterns and org-unit ids.
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


class BrightspaceAdapter(BaseLMSAdapter):
    """Adapter for the Brightspace (D2L) Valence API."""

    # -- helpers ----------------------------------------------------------

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.access_token}"}

    async def _get(self, path: str) -> list[dict[str, Any]]:
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._headers())
            resp.raise_for_status()
            data = resp.json()
            return data if isinstance(data, list) else [data]

    # -- public API -------------------------------------------------------

    async def get_assignments(self, course_id: str) -> list[Assignment]:
        items = await self._get(f"/d2l/api/le/1.67/{course_id}/dropbox/folders/")
        return [
            Assignment(
                id=str(a["Id"]),
                title=a.get("Name", ""),
                description=a.get("Instructions", {}).get("Text", "") or "",
                due_date=_parse_dt(a.get("DueDate")),
                points_possible=a.get("Assessment", {}).get("ScoreDenominator"),
                url=(
                    f"{self.base_url}/d2l/lms/dropbox/user/"
                    f"folder_submit_files.d2l?ou={course_id}&db={a['Id']}"
                ),
            )
            for a in items
        ]

    async def get_announcements(self, course_id: str) -> list[Announcement]:
        items = await self._get(f"/d2l/api/le/1.67/{course_id}/news/")
        return [
            Announcement(
                id=str(a["Id"]),
                title=a.get("Title", ""),
                message=a.get("Body", {}).get("Text", "") or "",
                posted_at=_parse_dt(a.get("StartDate")),
                url=f"{self.base_url}/d2l/lms/news/main.d2l?ou={course_id}",
            )
            for a in items
        ]

    async def get_pages(self, course_id: str) -> list[Page]:
        items = await self._get(f"/d2l/api/le/1.67/{course_id}/content/toc")
        pages: list[Page] = []
        for module in items:
            for topic in module.get("Topics", []):
                pages.append(
                    Page(
                        id=str(topic.get("TopicId", "")),
                        title=topic.get("Title", ""),
                        body=topic.get("Description", {}).get("Text", "") or "",
                        updated_at=_parse_dt(topic.get("LastModifiedDate")),
                        url=topic.get("Url") or (
                            f"{self.base_url}/d2l/le/content/{course_id}/viewContent/"
                            f"{topic.get('TopicId', '')}/View"
                        ),
                    )
                )
        return pages

    async def get_discussions(self, course_id: str) -> list[Discussion]:
        items = await self._get(f"/d2l/api/le/1.67/{course_id}/discussions/forums/")
        discussions: list[Discussion] = []
        for forum in items:
            for topic in forum.get("Topics", []):
                discussions.append(
                    Discussion(
                        id=str(topic.get("TopicId", "")),
                        title=topic.get("Name", ""),
                        message=topic.get("Description", {}).get("Text", "") or "",
                        posted_at=None,
                        url=(
                            f"{self.base_url}/d2l/le/{course_id}/"
                            f"discussions/topics/{topic.get('TopicId', '')}/View"
                        ),
                    )
                )
        return discussions

    async def get_modules(self, course_id: str) -> list[ModuleItem]:
        items = await self._get(f"/d2l/api/le/1.67/{course_id}/content/toc")
        results: list[ModuleItem] = []
        for module in items:
            results.append(
                ModuleItem(
                    id=str(module.get("ModuleId", "")),
                    title=module.get("Title", ""),
                    item_type="module",
                    url=(
                        f"{self.base_url}/d2l/le/content/{course_id}/Home"
                    ),
                )
            )
        return results

    async def get_course_info(self, course_id: str) -> CourseInfo:
        data = (await self._get(f"/d2l/api/lp/1.30/courses/{course_id}"))[0]
        return CourseInfo(
            id=str(data.get("Identifier", course_id)),
            name=data.get("Name", ""),
            code=data.get("Code", ""),
        )
