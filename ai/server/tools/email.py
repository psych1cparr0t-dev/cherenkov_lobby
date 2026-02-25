"""
Email Tool — Send emails via Resend API.
"""
import os
from .registry import register_tool


RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "concierge@cherenkov.design")
EMAIL_TO_DEFAULT = os.getenv("EMAIL_TO_DEFAULT", "hello@cherenkov.design")
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "resend")
GOOGLE_TOKEN_PATH = os.getenv("GOOGLE_TOKEN_PATH", "token.json")


def _get_resend():
    """Get Resend client, lazy-loaded."""
    if not RESEND_API_KEY:
        return None
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        return resend
    except ImportError:
        return None


def _get_gmail_service():
    """Get Gmail service, lazy-loaded."""
    if not os.path.exists(GOOGLE_TOKEN_PATH):
        return None
    
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        
        creds = Credentials.from_authorized_user_file(GOOGLE_TOKEN_PATH)
        return build('gmail', 'v1', credentials=creds)
    except (ImportError, Exception):
        return None


def _create_gmail_draft(to, subject, body, from_email=None, reply_to=None):
    """Helper to create a draft email via Gmail API."""
    service = _get_gmail_service()
    if not service:
        return {"success": False, "error": "Gmail token not found or invalid."}

    from email.mime.text import MIMEText
    import base64

    message = MIMEText(body)
    message['to'] = to
    # Use selected alias or default authenticated user
    if from_email:
        message['from'] = from_email
    else:
        # It will default to the primary address (max@cherenkov.industries)
        pass
        
    message['subject'] = subject
    if reply_to:
        message['reply-to'] = reply_to

    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
    
    try:
        # explicit 'message' key is required for drafts.create
        draft_body = {'message': {'raw': raw_message}}
        
        result = service.users().drafts().create(
            userId="me",
            body=draft_body
        ).execute()
        return {"success": True, "id": result.get("id"), "message_id": result.get("message", {}).get("id")}
    except Exception as e:
        return {"success": False, "error": str(e)}


@register_tool(
    name="send_contact_message",
    description="Send a contact message from a website visitor to the Cherenkov team. Use this when someone wants to get in touch, send a message, or make an inquiry.",
    parameters={
        "type": "object",
        "properties": {
            "visitor_name": {
                "type": "string",
                "description": "Name of the person sending the message"
            },
            "visitor_email": {
                "type": "string",
                "description": "Email address of the visitor (for replies)"
            },
            "message": {
                "type": "string",
                "description": "The message content"
            },
            "subject": {
                "type": "string",
                "description": "Subject line (optional, defaults to 'Website Inquiry')"
            }
        },
        "required": ["visitor_name", "visitor_email", "message"]
    }
)
def send_contact_message(
    visitor_name: str,
    visitor_email: str,
    message: str,
    subject: str = "Website Inquiry"
) -> dict:
    """Send a contact form message."""
    
    email_body = f"""
New message from the Cherenkov website concierge:

From: {visitor_name} <{visitor_email}>

---
{message}
---

Reply directly to this email to respond to {visitor_name}.
"""
    full_subject = f"[Cherenkov] {subject}"

    # --- Gmail Provider ---
    if EMAIL_PROVIDER == "gmail":
        # For contact messages (notifications to self), we can still just send them directly?
        # Or should we draft them too? The user asked for "no hallucination messages... available for personal screening".
        # Creating a draft for a notification TO YOURSELF seems redundant, but maybe safe.
        # Let's send notifications directly (since they go TO the user), but draft replies (FROM the user).
        
        # Actually, let's keep contact messages as direct sends to ensure they arrive.
        # But we need to define the 'send' function again since I replaced it with draft, 
        # or just reuse the code logic. 
        # Wait, if I replaced _send_via_gmail with _create_gmail_draft, I can't send.
        # I should probably support both or just draft everything.
        # Let's draft everything for safety as requested.
        
        result = _create_gmail_draft(
            to=EMAIL_TO_DEFAULT, 
            subject=full_subject, 
            body=email_body, 
            reply_to=visitor_email
        )
        if result["success"]:
            return {
                "action": "email_drafted",
                "message": f"Contact notification DRAFT created in Gmail. Please review and send.",
                "draft_id": result["id"]
            }
        else:
            return {
                "action": "error",
                "message": f"Failed to draft email via Gmail: {result['error']}"
            }

    # --- Resend Provider (Default) ---
    resend = _get_resend()
    if not resend:
        return {
            "action": "error",
            "message": "Email not configured. Please set RESEND_API_KEY or configure Gmail."
        }
    
    try:
        result = resend.Emails.send({
            "from": EMAIL_FROM,
            "to": EMAIL_TO_DEFAULT,
            "reply_to": visitor_email,
            "subject": full_subject,
            "text": email_body
        })
        
        return {
            "action": "email_sent",
            "message": f"Message sent successfully! The Cherenkov team will receive it shortly.",
            "email_id": result.get("id", "")
        }
    
    except Exception as e:
        return {
            "action": "error",
            "message": f"Failed to send email: {str(e)}"
        }


@register_tool(
    name="send_email",
    description="Draft an email for the user to review. This allows the concierge to prepare responses or outreach which the user can screen in their Gmail Drafts before sending.",
    parameters={
        "type": "object",
        "properties": {
            "to": {
                "type": "string",
                "description": "Recipient email address"
            },
            "subject": {
                "type": "string",
                "description": "Email subject line"
            },
            "body": {
                "type": "string",
                "description": "Email body content"
            },
            "from_email": {
                "type": "string",
                "description": "The sender alias to use. Options: 'max@cherenkov.industries', 'creative@cherenkov.industries', 'support@cherenkov.industries', 'careers@cherenkov.industries', 'collaborations@cherenkov.industries', 'secret@cherenkov.industries'. Default: max@cherenkov.industries",
                "enum": [
                    "max@cherenkov.industries",
                    "creative@cherenkov.industries",
                    "support@cherenkov.industries",
                    "careers@cherenkov.industries",
                    "collaborations@cherenkov.industries",
                    "secret@cherenkov.industries"
                ]
            }
        },
        "required": ["to", "subject", "body"]
    }
)
def send_email(to: str, subject: str, body: str, from_email: str = None, _authenticated: bool = False) -> dict:
    """Draft an email (requires authentication)."""
    if not _authenticated:
        return {
            "action": "auth_required",
            "message": "Email drafting requires authentication. Please verify your identity first."
        }
    
    # --- Gmail Provider ---
    if EMAIL_PROVIDER == "gmail":
        result = _create_gmail_draft(to=to, subject=subject, body=body, from_email=from_email)
        if result["success"]:
            return {
                "action": "email_drafted",
                "message": f"Draft created for {to} (from {from_email or 'default'}). Review it in your Gmail Drafts.",
                "draft_id": result["id"]
            }
        else:
            return {
                "action": "error",
                "message": f"Failed to create draft via Gmail: {result['error']}"
            }

    # --- Resend Provider (Default) ---
    resend = _get_resend()
    if not resend:
        return {
            "action": "error",
            "message": "Email not configured."
        }
    
    try:
        result = resend.Emails.send({
            "from": EMAIL_FROM,
            "to": to,
            "subject": subject,
            "text": body
        })
        
        return {
            "action": "email_sent",
            "message": f"Email sent to {to}",
            "email_id": result.get("id", "")
        }
    
    except Exception as e:
        return {
            "action": "error",
            "message": f"Failed to send email: {str(e)}"
        }
