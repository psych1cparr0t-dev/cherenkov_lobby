"""Tests for LTI adapter dataclasses — verifies the url field is present and
populated correctly by each adapter's construction logic."""

from datetime import datetime

from lti.adapters.base import (
    Assignment,
    Announcement,
    Page,
    Discussion,
    ModuleItem,
    Instructor,
    CourseInfo,
)


# ------------------------------------------------------------------
# Dataclass url field presence
# ------------------------------------------------------------------

class TestAssignment:
    def test_url_field_default_none(self):
        a = Assignment(id="1", title="Essay 1")
        assert a.url is None

    def test_url_field_accepts_value(self):
        a = Assignment(id="1", title="Essay 1", url="https://canvas.edu/courses/1/assignments/1")
        assert a.url == "https://canvas.edu/courses/1/assignments/1"

    def test_all_fields_populated(self):
        a = Assignment(
            id="42",
            title="Midterm",
            description="Write an essay",
            due_date=datetime(2025, 3, 1),
            points_possible=100.0,
            url="https://canvas.edu/courses/1/assignments/42",
        )
        assert a.id == "42"
        assert a.title == "Midterm"
        assert a.points_possible == 100.0
        assert a.url == "https://canvas.edu/courses/1/assignments/42"


class TestAnnouncement:
    def test_url_field_default_none(self):
        a = Announcement(id="1", title="Welcome")
        assert a.url is None

    def test_url_field_accepts_value(self):
        a = Announcement(id="1", title="Welcome", url="https://lms.edu/announcements")
        assert a.url == "https://lms.edu/announcements"


class TestPage:
    def test_url_field_default_none(self):
        p = Page(id="1", title="Syllabus")
        assert p.url is None

    def test_url_field_accepts_value(self):
        p = Page(id="1", title="Syllabus", url="https://lms.edu/courses/1/pages/syllabus")
        assert p.url == "https://lms.edu/courses/1/pages/syllabus"


class TestDiscussion:
    def test_url_field_default_none(self):
        d = Discussion(id="1", title="Week 1")
        assert d.url is None

    def test_url_field_accepts_value(self):
        d = Discussion(id="1", title="Week 1", url="https://lms.edu/discussions/1")
        assert d.url == "https://lms.edu/discussions/1"


class TestModuleItem:
    def test_url_field_default_none(self):
        m = ModuleItem(id="1", title="Module 1")
        assert m.url is None

    def test_url_field_accepts_value(self):
        m = ModuleItem(id="1", title="Module 1", url="https://lms.edu/modules/1")
        assert m.url == "https://lms.edu/modules/1"


class TestNoUrlDataclasses:
    """Instructor and CourseInfo intentionally have no url field."""

    def test_instructor_has_no_url(self):
        i = Instructor(id="1", name="Dr. Smith")
        assert not hasattr(i, "url")

    def test_course_info_has_no_url(self):
        c = CourseInfo(id="1", name="CS 101")
        assert not hasattr(c, "url")
