"""
Apple Calendar Tool — iCloud calendar via CalDAV protocol.
"""
import os
from datetime import datetime, timedelta
from .registry import register_tool


APPLE_CALDAV_URL = os.getenv("APPLE_CALDAV_URL", "https://caldav.icloud.com")
APPLE_USERNAME = os.getenv("APPLE_USERNAME", "")
APPLE_APP_PASSWORD = os.getenv("APPLE_APP_PASSWORD", "")  # App-specific password
APPLE_CALENDAR_NAME = os.getenv("APPLE_CALENDAR_NAME", "Calendar")


def _get_apple_calendar():
    """Get Apple Calendar (CalDAV) client, lazy-loaded."""
    if not APPLE_USERNAME or not APPLE_APP_PASSWORD:
        return None
    
    try:
        import caldav
        
        client = caldav.DAVClient(
            url=APPLE_CALDAV_URL,
            username=APPLE_USERNAME,
            password=APPLE_APP_PASSWORD
        )
        
        principal = client.principal()
        calendars = principal.calendars()
        
        # Find the specified calendar or use first one
        for cal in calendars:
            if cal.name == APPLE_CALENDAR_NAME or not APPLE_CALENDAR_NAME:
                return cal
        
        return calendars[0] if calendars else None
    
    except (ImportError, Exception):
        return None


@register_tool(
    name="get_apple_availability",
    description="Check iCloud calendar availability for scheduling. Use this for users who prefer Apple Calendar.",
    parameters={
        "type": "object",
        "properties": {
            "date": {
                "type": "string",
                "description": "Date to check (YYYY-MM-DD, 'today', 'tomorrow')"
            }
        },
        "required": ["date"]
    }
)
def get_apple_availability(date: str) -> dict:
    """Get availability from Apple Calendar."""
    calendar = _get_apple_calendar()
    if not calendar:
        return {
            "action": "error",
            "message": "Apple Calendar not configured. Set APPLE_USERNAME and APPLE_APP_PASSWORD."
        }
    
    # Parse date
    try:
        if date.lower() == "today":
            target_date = datetime.now()
        elif date.lower() == "tomorrow":
            target_date = datetime.now() + timedelta(days=1)
        else:
            target_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return {
            "action": "error",
            "message": f"Invalid date format: {date}"
        }
    
    try:
        # Get events for the day
        day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = target_date.replace(hour=23, minute=59, second=59, microsecond=0)
        
        events = calendar.date_search(start=day_start, end=day_end)
        
        busy_times = []
        for event in events:
            try:
                vevent = event.vobject_instance.vevent
                busy_times.append({
                    "start": vevent.dtstart.value.strftime("%H:%M"),
                    "end": vevent.dtend.value.strftime("%H:%M"),
                    "title": str(vevent.summary.value) if hasattr(vevent, 'summary') else "Busy"
                })
            except Exception:
                continue
        
        # Calculate free slots (9 AM - 6 PM)
        work_start = target_date.replace(hour=9, minute=0)
        work_end = target_date.replace(hour=18, minute=0)
        
        # Sort busy times and find gaps
        busy_times.sort(key=lambda x: x["start"])
        
        return {
            "action": "availability",
            "date": target_date.strftime("%Y-%m-%d"),
            "busy_times": busy_times,
            "events_count": len(busy_times),
            "formatted": "\n".join([f"• {b['start']} - {b['end']}: {b['title']}" for b in busy_times]) if busy_times else "Calendar is clear!"
        }
    
    except Exception as e:
        return {
            "action": "error",
            "message": f"Failed to check Apple Calendar: {str(e)}"
        }


@register_tool(
    name="create_apple_event",
    description="Create an event on iCloud calendar.",
    parameters={
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Event title"
            },
            "date": {
                "type": "string",
                "description": "Date (YYYY-MM-DD)"
            },
            "time": {
                "type": "string",
                "description": "Start time (HH:MM)"
            },
            "duration_minutes": {
                "type": "integer",
                "description": "Duration in minutes"
            },
            "description": {
                "type": "string",
                "description": "Event description"
            }
        },
        "required": ["title", "date", "time"]
    }
)
def create_apple_event(
    title: str,
    date: str,
    time: str,
    duration_minutes: int = 30,
    description: str = ""
) -> dict:
    """Create an event on Apple Calendar."""
    calendar = _get_apple_calendar()
    if not calendar:
        return {
            "action": "error",
            "message": "Apple Calendar not configured."
        }
    
    try:
        start_dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
        end_dt = start_dt + timedelta(minutes=duration_minutes)
        
        # Create iCalendar event
        ical = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cherenkov Concierge//EN
BEGIN:VEVENT
DTSTART:{start_dt.strftime('%Y%m%dT%H%M%S')}
DTEND:{end_dt.strftime('%Y%m%dT%H%M%S')}
SUMMARY:{title}
DESCRIPTION:{description}
END:VEVENT
END:VCALENDAR"""
        
        event = calendar.save_event(ical)
        
        return {
            "action": "event_created",
            "message": f"Event '{title}' created for {date} at {time}",
            "event_url": event.url if hasattr(event, 'url') else ""
        }
    
    except Exception as e:
        return {
            "action": "error",
            "message": f"Failed to create event: {str(e)}"
        }
