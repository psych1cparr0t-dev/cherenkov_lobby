"""
Base dataclasses and abstract adapter for LMS integrations.
Each LMS adapter (Canvas, Blackboard, Brightspace) implements BaseLMSAdapter.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Assignment:
    id: str
    title: str
    description: str = ""
    due_date: Optional[datetime] = None
    points_possible: Optional[float] = None
    url: Optional[str] = None

@dataclass
class Announcement:
    id: str
    title: str
    message: str = ""
    posted_at: Optional[datetime] = None
    url: Optional[str] = None

@dataclass
class Page:
    id: str
    title: str
    body: str = ""
    updated_at: Optional[datetime] = None
    url: Optional[str] = None

@dataclass
class Discussion:
    id: str
    title: str
    message: str = ""
    posted_at: Optional[datetime] = None
    url: Optional[str] = None

@dataclass
class ModuleItem:
    id: str
    title: str
    item_type: str = ""
    url: Optional[str] = None

@dataclass
class Instructor:
    id: str
    name: str
    email: str = ""

@dataclass
class CourseInfo:
    id: str
    name: str
    code: str = ""
    term: str = ""


class BaseLMSAdapter(ABC):
    """Abstract interface every LMS adapter must implement."""

    def __init__(self, base_url: str, access_token: str):
        self.base_url = base_url.rstrip("/")
        self.access_token = access_token

    @abstractmethod
    async def get_assignments(self, course_id: str) -> list[Assignment]: ...

    @abstractmethod
    async def get_announcements(self, course_id: str) -> list[Announcement]: ...

    @abstractmethod
    async def get_pages(self, course_id: str) -> list[Page]: ...

    @abstractmethod
    async def get_discussions(self, course_id: str) -> list[Discussion]: ...

    @abstractmethod
    async def get_modules(self, course_id: str) -> list[ModuleItem]: ...

    @abstractmethod
    async def get_course_info(self, course_id: str) -> CourseInfo: ...
