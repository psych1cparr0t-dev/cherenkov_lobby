import os
import datetime
from config import GOOGLE_TOKEN_PATH
from tools.registry import register_tool

def _get_service(api_name, api_version):
    """Helper to get an authenticated Google API service."""
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
    except ImportError:
        print("Google API client libraries not installed.")
        return None

    token_path = GOOGLE_TOKEN_PATH

    # Support Vercel: Load token from environment variable if file is missing
    if not os.path.exists(token_path) and os.getenv("GOOGLE_TOKEN_JSON"):
        import tempfile
        fd, temp_path = tempfile.mkstemp(suffix=".json")
        with os.fdopen(fd, 'w') as f:
            f.write(os.getenv("GOOGLE_TOKEN_JSON") or "")
        token_path = temp_path

    if not os.path.exists(token_path):
        return None

    try:
        creds = Credentials.from_authorized_user_file(token_path)
        return build(api_name, api_version, credentials=creds)
    except Exception as e:
        print(f"Error loading {api_name} credentials: {e}")
        return None

# --- Google Tasks Tools ---

@register_tool(
    name="list_tasks",
    description="List active tasks from the user's default Google Task list.",
    parameters={
        "type": "object",
        "properties": {
            "maxutils": {
                "type": "integer", 
                "description": "Maximum number of tasks to return (default 10)"
            }
        }
    }
)
def list_tasks(max_results: int = 10) -> dict:
    """List tasks from the default task list."""
    service = _get_service('tasks', 'v1')
    if not service:
        return {"error": "Google Tasks authentication failed."}

    try:
        results = service.tasks().list(tasklist='@default', maxResults=max_results, showHidden=False).execute()
        items = results.get('items', [])
        
        if not items:
            return {"tasks": [], "message": "No tasks found."}

        formatted_tasks = []
        for item in items:
            formatted_tasks.append({
                "title": item['title'],
                "status": item['status'],
                "due": item.get('due', 'No due date'),
                "id": item['id']
            })
            
        return {"tasks": formatted_tasks}
    except Exception as e:
        return {"error": str(e)}

@register_tool(
    name="add_task",
    description="Add a new task to the user's default Google Task list.",
    parameters={
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Title of the task"
            },
            "notes": {
                "type": "string",
                "description": "Optional notes or details for the task"
            },
            "due_date": {
                "type": "string",
                "description": "Due date in RFC 3339 format (e.g. 2023-10-25T12:00:00Z). Optional."
            }
        },
        "required": ["title"]
    }
)
def add_task(title: str, notes: str = None, due_date: str = None) -> dict:
    """Add a new task."""
    service = _get_service('tasks', 'v1')
    if not service:
        return {"error": "Google Tasks authentication failed."}

    task_body = {
        'title': title,
        'notes': notes
    }
    if due_date:
        task_body['due'] = due_date

    try:
        result = service.tasks().insert(tasklist='@default', body=task_body).execute()
        return {
            "success": True, 
            "task_id": result['id'], 
            "title": result['title'],
            "status": "created"
        }
    except Exception as e:
        return {"error": str(e)}

# --- Google People (Contacts) Tools ---

@register_tool(
    name="search_contacts",
    description="Search for a contact's email address by name using Google People API.",
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Name to search for"
            }
        },
        "required": ["query"]
    }
)
def search_contacts(query: str) -> dict:
    """Search for contacts."""
    service = _get_service('people', 'v1')
    if not service:
        return {"error": "Google People authentication failed."}

    try:
        # searchContacts is the method for searching
        results = service.people().searchContacts(
            query=query, 
            readMask="names,emailAddresses"
        ).execute()
        
        connections = results.get('results', [])
        
        found_contacts = []
        for person_result in connections:
            person = person_result.get('person', {})
            names = person.get('names', [])
            emails = person.get('emailAddresses', [])
            
            if names and emails:
                found_contacts.append({
                    "name": names[0].get('displayName'),
                    "email": emails[0].get('value')
                })
                
        return {"contacts": found_contacts}
    except Exception as e:
        return {"error": str(e)}

# --- Google Drive/Docs/Sheets Tools ---

@register_tool(
    name="list_drive_files",
    description="List files in Google Drive (search by name or type).",
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Name or query to search for (e.g. 'project plan' or 'type:spreadsheet')"
            },
            "limit": {
                "type": "integer",
                "description": "Max number of files to return (default 5)"
            }
        },
        "required": ["query"]
    }
)
def list_drive_files(query: str, limit: int = 5) -> dict:
    """Search for files in Drive."""
    service = _get_service('drive', 'v3')
    if not service:
        return {"error": "Google Drive authentication failed."}

    # Construct query. A simple name contain search
    # If user provides specifiers like 'type:spreadsheet', we could parse it, but let's keep it simple:
    # name contains 'query' and trashed = false
    q = f"name contains '{query}' and trashed = false"
    
    try:
        results = service.files().list(
            q=q, 
            pageSize=limit, 
            fields="nextPageToken, files(id, name, mimeType, webViewLink)"
        ).execute()
        items = results.get('files', [])
        return {"files": items}
    except Exception as e:
        return {"error": str(e)}


@register_tool(
    name="read_sheet",
    description="Read data from a Google Sheet. Requires the File ID (use list_drive_files to find it).",
    parameters={
        "type": "object",
        "properties": {
            "spreadsheet_id": {
                "type": "string",
                "description": "The ID of the spreadsheet"
            },
            "range_name": {
                "type": "string",
                "description": "A1 notation range to read (e.g. 'Sheet1!A1:E10'). Default is 'A1:Z100'."
            }
        },
        "required": ["spreadsheet_id"]
    }
)
def read_sheet(spreadsheet_id: str, range_name: str = "A1:Z100") -> dict:
    """Read values from a Google Sheet."""
    service = _get_service('sheets', 'v4')
    if not service:
        return {"error": "Google Sheets authentication failed."}

    try:
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id, range=range_name).execute()
        rows = result.get('values', [])
        return {"row_count": len(rows), "data": rows}
    except Exception as e:
        return {"error": str(e)}


@register_tool(
    name="read_doc",
    description="Read text from a Google Doc. Requires the File ID.",
    parameters={
        "type": "object",
        "properties": {
            "document_id": {
                "type": "string",
                "description": "The ID of the document"
            }
        },
        "required": ["document_id"]
    }
)
def read_doc(document_id: str) -> dict:
    """Read text content from a Google Doc."""
    service = _get_service('docs', 'v1')
    if not service:
        return {"error": "Google Docs authentication failed."}

    try:
        document = service.documents().get(documentId=document_id).execute()
        content = document.get('body').get('content')
        
        full_text = ""
        for element in content:
            if 'paragraph' in element:
                elements = element.get('paragraph').get('elements')
                for elem in elements:
                    if 'textRun' in elem:
                        full_text += elem.get('textRun').get('content')
                        
        return {"title": document.get('title'), "content": full_text}
    except Exception as e:
        return {"error": str(e)}
