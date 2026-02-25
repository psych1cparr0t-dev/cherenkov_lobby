"""
Google Calendar Tool — Scheduling and availability via Google Calendar API.
"""
import os
from datetime import datetime, timedelta
from .registry import register_tool


GOOGLE_TOKEN_PATH = os.getenv("GOOGLE_TOKEN_PATH", "token.json")
GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")


def _get_google_calendar():
    """Get Google Calendar service."""
    token_path = GOOGLE_TOKEN_PATH
    
    # Support Vercel: Load token from environment variable if file is missing
    if not os.path.exists(token_path) and os.getenv("GOOGLE_TOKEN_JSON"):
        import tempfile
        import json
        fd, temp_path = tempfile.mkstemp(suffix=".json")
        with os.fdopen(fd, 'w') as f:
            f.write(os.getenv("GOOGLE_TOKEN_JSON"))
        token_path = temp_path

    if not os.path.exists(token_path):
        return None

    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build

        creds = Credentials.from_authorized_user_file(token_path)
        return build("calendar", "v3", credentials=creds)
    except (ImportError, Exception) as e:
        print(f"Error loading Google Calendar credentials: {e}")
        return None
@register_tool(
    name="get_availability",
    description="Check calendar availability for scheduling meetings. Use this when someone asks about available times or wants to schedule a call.",
    parameters={
        "type": "object",
        "properties": {
            "date": {
                "type": "string",
                "description": "Date to check availability (YYYY-MM-DD format, or 'today', 'tomorrow', 'next week')"
            },
            "duration_minutes": {
                "type": "integer",
                "description": "Meeting duration in minutes (default 30)"
            }
        },
        "required": ["date"]
    }
)
def get_availability(date: str, duration_minutes: int = 30) -> dict:
    """Get available time slots for a given date."""
    service = _get_google_calendar()
    if not service:
        return {
            "action": "error",
            "message": "Google Calendar not configured. Please set up credentials."
        }
    
    # Parse date
    try:
        if date.lower() == "today":
            target_date = datetime.now()
        elif date.lower() == "tomorrow":
            target_date = datetime.now() + timedelta(days=1)
        elif date.lower() == "next week":
            target_date = datetime.now() + timedelta(days=7)
        else:
            target_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return {
            "action": "error",
            "message": f"Invalid date format: {date}. Use YYYY-MM-DD, 'today', 'tomorrow', or 'next week'."
        }
    
    try:
        # Set time range for the day (9 AM to 6 PM)
        day_start = target_date.replace(hour=9, minute=0, second=0, microsecond=0)
        day_end = target_date.replace(hour=18, minute=0, second=0, microsecond=0)
        
        # Query busy times
        body = {
            "timeMin": day_start.isoformat() + "Z",
            "timeMax": day_end.isoformat() + "Z",
            "items": [{"id": GOOGLE_CALENDAR_ID}]
        }
        
        freebusy = service.freebusy().query(body=body).execute()
        busy_times = freebusy.get("calendars", {}).get(GOOGLE_CALENDAR_ID, {}).get("busy", [])
        
        # Calculate free slots
        free_slots = []
        current_time = day_start
        
        for busy in busy_times:
            busy_start = datetime.fromisoformat(busy["start"].replace("Z", "+00:00"))
            if current_time < busy_start:
                free_slots.append({
                    "start": current_time.strftime("%H:%M"),
                    "end": busy_start.strftime("%H:%M")
                })
            current_time = datetime.fromisoformat(busy["end"].replace("Z", "+00:00"))
        
        if current_time < day_end:
            free_slots.append({
                "start": current_time.strftime("%H:%M"),
                "end": day_end.strftime("%H:%M")
            })
        
        return {
            "action": "availability",
            "date": target_date.strftime("%Y-%m-%d"),
            "free_slots": free_slots,
            "formatted": "\n".join([f"• {s['start']} - {s['end']}" for s in free_slots]) if free_slots else "No available slots"
        }
    
    except Exception as e:
        return {
            "action": "error",
            "message": f"Failed to check availability: {str(e)}"
        }


@register_tool(
    name="create_calendar_event",
    description="Schedule a new meeting or event on the calendar. Use this when someone wants to book a specific time slot.",
    parameters={
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Event title/name"
            },
            "date": {
                "type": "string",
                "description": "Date for the event (YYYY-MM-DD)"
            },
            "time": {
                "type": "string",
                "description": "Start time (HH:MM in 24-hour format)"
            },
            "duration_minutes": {
                "type": "integer",
                "description": "Duration in minutes (default 30)"
            },
            "attendee_email": {
                "type": "string",
                "description": "Email of the attendee to invite"
            },
            "description": {
                "type": "string",
                "description": "Optional event description or notes"
            }
        },
        "required": ["title", "date", "time"]
    }
)
def create_calendar_event(
    title: str,
    date: str,
    time: str,
    duration_minutes: int = 30,
    attendee_email: str = "",
    description: str = ""
) -> dict:
    """Create a calendar event."""
    service = _get_google_calendar()
    if not service:
        return {
            "action": "error",
            "message": "Google Calendar not configured."
        }
    
    try:
        # Parse date and time
        start_dt = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
        end_dt = start_dt + timedelta(minutes=duration_minutes)
        
        event = {
            "summary": title,
            "description": description,
            "start": {
                "dateTime": start_dt.isoformat(),
                "timeZone": "America/New_York"  # TODO: Make configurable
            },
            "end": {
                "dateTime": end_dt.isoformat(),
                "timeZone": "America/New_York"
            }
        }
        
        if attendee_email:
            event["attendees"] = [{"email": attendee_email}]
        
        result = service.events().insert(
            calendarId=GOOGLE_CALENDAR_ID,
            body=event,
            sendUpdates="all" if attendee_email else "none"
        ).execute()
        
        return {
            "action": "event_created",
            "message": f"Event '{title}' scheduled for {date} at {time}",
            "event_id": result.get("id", ""),
            "event_link": result.get("htmlLink", "")
        }
    
    except ValueError as e:
        return {
            "action": "error",
            "message": f"Invalid date/time format: {str(e)}"
        }
    except Exception as e:
        return {
            "action": "error", 
            "message": f"Failed to create event: {str(e)}"
        }
