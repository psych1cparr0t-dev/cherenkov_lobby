"""Tests for course search index and URL resolution."""

from lti.adapters.base import Assignment, Announcement, Page, Discussion
from services.course_search import CourseSearchIndex, ContentChunk


# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------

def _make_index() -> CourseSearchIndex:
    """Build an index with a handful of items across content types."""
    idx = CourseSearchIndex()
    idx.index_course(
        "CS101",
        assignments=[
            Assignment(id="a1", title="Midterm Essay", description="Write a 5-page essay on AI ethics", url="https://canvas.edu/courses/CS101/assignments/a1"),
            Assignment(id="a2", title="Final Project", description="Build a chatbot", url="https://canvas.edu/courses/CS101/assignments/a2"),
            Assignment(id="a3", title="Homework 3", description="Complete exercises 1-10"),
        ],
        announcements=[
            Announcement(id="n1", title="Welcome to CS101", message="Please read the syllabus", url="https://canvas.edu/courses/CS101/announcements"),
        ],
        pages=[
            Page(id="p1", title="Syllabus", body="Course overview and policies", url="https://canvas.edu/courses/CS101/pages/syllabus"),
        ],
        discussions=[
            Discussion(id="d1", title="Introduce Yourself", message="Post a short intro", url="https://canvas.edu/courses/CS101/discussions/d1"),
        ],
    )
    return idx


# ------------------------------------------------------------------
# resolve_url tests
# ------------------------------------------------------------------

class TestResolveUrl:
    def test_returns_url_for_matching_assignment(self):
        idx = _make_index()
        url = idx.resolve_url("CS101", "midterm essay")
        assert url == "https://canvas.edu/courses/CS101/assignments/a1"

    def test_returns_url_for_matching_page(self):
        idx = _make_index()
        url = idx.resolve_url("CS101", "syllabus")
        assert url == "https://canvas.edu/courses/CS101/pages/syllabus"

    def test_returns_url_for_matching_discussion(self):
        idx = _make_index()
        url = idx.resolve_url("CS101", "introduce yourself")
        assert url == "https://canvas.edu/courses/CS101/discussions/d1"

    def test_returns_url_for_announcement(self):
        idx = _make_index()
        url = idx.resolve_url("CS101", "welcome CS101")
        assert url == "https://canvas.edu/courses/CS101/announcements"

    def test_returns_none_when_no_url(self):
        """Homework 3 has no url — should return None."""
        idx = CourseSearchIndex()
        idx.index_course(
            "CS101",
            assignments=[
                Assignment(id="a3", title="Homework 3", description="Complete exercises"),
            ],
        )
        url = idx.resolve_url("CS101", "homework 3")
        assert url is None

    def test_returns_none_for_unknown_course(self):
        idx = _make_index()
        url = idx.resolve_url("UNKNOWN", "midterm essay")
        assert url is None

    def test_returns_none_for_empty_query(self):
        idx = _make_index()
        url = idx.resolve_url("CS101", "")
        assert url is None

    def test_returns_none_for_no_match(self):
        idx = _make_index()
        url = idx.resolve_url("CS101", "xyzzy foobar gibberish")
        assert url is None


class TestResolve:
    def test_returns_dict_with_url_and_title(self):
        idx = _make_index()
        result = idx.resolve("CS101", "final project")
        assert result is not None
        assert result["url"] == "https://canvas.edu/courses/CS101/assignments/a2"
        assert result["title"] == "Final Project"
        assert result["type"] == "assignment"

    def test_returns_none_when_no_match(self):
        idx = _make_index()
        result = idx.resolve("CS101", "xyzzy")
        assert result is None


class TestIndexCourse:
    def test_returns_chunk_count(self):
        idx = _make_index()
        # 3 assignments + 1 announcement + 1 page + 1 discussion = 6
        assert len(idx._chunks["CS101"]) == 6

    def test_empty_index_returns_zero(self):
        idx = CourseSearchIndex()
        count = idx.index_course("EMPTY")
        assert count == 0

    def test_metadata_stores_url(self):
        idx = _make_index()
        chunk = idx._chunks["CS101"][0]
        assert "url" in chunk.metadata
        assert chunk.metadata["url"] == "https://canvas.edu/courses/CS101/assignments/a1"
