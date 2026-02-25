"""
Configuration settings for the Cherenkov AI server.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
KNOWLEDGE_DIR = BASE_DIR / "knowledge"
CHROMA_DIR = BASE_DIR / "ai" / "server" / "chroma_db"

# Anthropic Settings (Cloud Backend)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307")

# RAG settings
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K_RESULTS = 3

# API settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# --- Tool Integrations ---

# Airtable
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY", "")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID", "")
AIRTABLE_PROJECTS_TABLE = os.getenv("AIRTABLE_PROJECTS_TABLE", "Projects")
AIRTABLE_CLIENTS_TABLE = os.getenv("AIRTABLE_CLIENTS_TABLE", "Clients")

# Email (Resend)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "concierge@cherenkov.design")
EMAIL_TO_DEFAULT = os.getenv("EMAIL_TO_DEFAULT", "hello@cherenkov.design")
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "resend")  # Options: "resend", "gmail"

# Google Services (Calendar & Gmail)
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
GOOGLE_TOKEN_PATH = os.getenv("GOOGLE_TOKEN_PATH", "token.json")
GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")

# Apple Calendar (iCloud CalDAV)
APPLE_CALDAV_URL = os.getenv("APPLE_CALDAV_URL", "https://caldav.icloud.com")
APPLE_USERNAME = os.getenv("APPLE_USERNAME", "")
APPLE_APP_PASSWORD = os.getenv("APPLE_APP_PASSWORD", "")
APPLE_CALENDAR_NAME = os.getenv("APPLE_CALENDAR_NAME", "Calendar")

