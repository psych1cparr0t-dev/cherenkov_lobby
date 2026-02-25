import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(".env")

from tools.airtable import get_projects
from tools.google_calendar import get_availability
from tools.email import send_email
def main():
    print("==== Testing Airtable API ====")
    try:
        res = get_projects(limit=2)
        print("Airtable Projects result:", res)
    except Exception as e:
        print("Airtable Error:", e)

    print("\n==== Testing Google Calendar API ====")
    try:
        res = get_availability(date="tomorrow", duration_minutes=30)
        print("Google Calendar result:", res)
    except Exception as e:
        print("Calendar Error:", e)

    print("\n==== Testing Email API (Draft) ====")
    try:
        res = send_email(to="info@cherenkov.com", subject="Test Draft", body="This is a test from the concierge test suite.", _authenticated=True)
        print("Email Draft result:", res)
    except Exception as e:
        print("Email Error:", e)

    print("\n==== Test Complete ====")

if __name__ == "__main__":
    main()
