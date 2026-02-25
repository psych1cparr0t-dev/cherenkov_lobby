"""
Airtable Tool — Client and project database integration.
"""
import os
from .registry import register_tool


# Will be configured via environment variables
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY", "")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID", "")
AIRTABLE_PROJECTS_TABLE = os.getenv("AIRTABLE_PROJECTS_TABLE", "Projects")
AIRTABLE_CLIENTS_TABLE = os.getenv("AIRTABLE_CLIENTS_TABLE", "Clients")


def _get_airtable():
    """Get Airtable client, lazy-loaded."""
    if not AIRTABLE_API_KEY or not AIRTABLE_BASE_ID:
        return None
    try:
        from pyairtable import Api
        api = Api(AIRTABLE_API_KEY)
        return api.base(AIRTABLE_BASE_ID)
    except ImportError:
        return None


@register_tool(
    name="get_projects",
    description="Get a list of current projects from the database. Can filter by status (active, completed, on-hold). Requires authentication for detailed project info.",
    parameters={
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "description": "Filter by project status",
                "enum": ["active", "completed", "on-hold", "all"]
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of projects to return (default 10)"
            }
        },
        "required": []
    }
)
def get_projects(status: str = "all", limit: int = 10) -> dict:
    """Get projects from Airtable."""
    base = _get_airtable()
    if not base:
        return {
            "action": "error",
            "message": "Airtable not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID."
        }
    
    try:
        table = base.table(AIRTABLE_PROJECTS_TABLE)
        
        # Build formula for filtering
        formula = None
        if status and status != "all":
            formula = f"{{Status}} = '{status}'"
        
        records = table.all(formula=formula, max_records=limit)
        
        projects = []
        for record in records:
            fields = record.get("fields", {})
            projects.append({
                "id": record["id"],
                "name": fields.get("Name", "Untitled"),
                "status": fields.get("Status", "unknown"),
                "client": fields.get("Client", ""),
                "description": fields.get("Description", "")[:100] if fields.get("Description") else ""
            })
        
        return {
            "action": "info",
            "projects": projects,
            "count": len(projects)
        }
    
    except Exception as e:
        return {
            "action": "error",
            "message": f"Failed to fetch projects: {str(e)}"
        }


@register_tool(
    name="get_project_details",
    description="Get detailed information about a specific project. Use this when someone asks about a particular project by name.",
    parameters={
        "type": "object",
        "properties": {
            "project_name": {
                "type": "string",
                "description": "Name of the project to look up"
            }
        },
        "required": ["project_name"]
    }
)
def get_project_details(project_name: str) -> dict:
    """Get details for a specific project."""
    base = _get_airtable()
    if not base:
        return {
            "action": "error",
            "message": "Airtable not configured."
        }
    
    try:
        table = base.table(AIRTABLE_PROJECTS_TABLE)
        
        # Search for project by name (case-insensitive)
        formula = f"LOWER({{Name}}) = LOWER('{project_name}')"
        records = table.all(formula=formula, max_records=1)
        
        if not records:
            return {
                "action": "not_found",
                "message": f"No project found with name: {project_name}"
            }
        
        fields = records[0].get("fields", {})
        return {
            "action": "info",
            "project": {
                "id": records[0]["id"],
                "name": fields.get("Name", ""),
                "status": fields.get("Status", ""),
                "client": fields.get("Client", ""),
                "description": fields.get("Description", ""),
                "start_date": fields.get("Start Date", ""),
                "due_date": fields.get("Due Date", ""),
                "team": fields.get("Team", []),
                "notes": fields.get("Notes", "")
            }
        }
    
    except Exception as e:
        return {
            "action": "error",
            "message": f"Failed to fetch project: {str(e)}"
        }
