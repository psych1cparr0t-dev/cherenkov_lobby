"""
Authorization script for Google APIs.
Generates token.json from credentials.json.
"""
import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Scopes required for the application
SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/tasks',              # Google Tasks
    'https://www.googleapis.com/auth/contacts.readonly',  # Google People (Contacts)
    'https://www.googleapis.com/auth/drive.metadata.readonly', # Google Drive (Search/List files)
    'https://www.googleapis.com/auth/documents.readonly', # Google Docs
    'https://www.googleapis.com/auth/spreadsheets.readonly' # Google Sheets
]

def main():
    creds = None
    # Paths are relative to where the script is run. 
    # Attempting to locate files robustly.
    
    # We expect this script to be in cherenkov_homepage/ai/server/scripts/
    # And credentials/token to be in cherenkov_homepage/ai/server/
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    token_path = os.path.join(base_dir, 'token.json')
    creds_path = os.path.join(base_dir, 'credentials.json')

    print(f"Looking for credentials at: {creds_path}")
    print(f"Token will be saved to: {token_path}")

    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(creds_path):
                print(f"\nError: {creds_path} not found.")
                print("Please download your OAuth 2.0 Client IDs (Desktop App) from Google Cloud Console")
                print(f"and save it as '{creds_path}'.")
                return

            flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save the credentials for the next run
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
            print(f"\nSuccess! Token saved to {token_path}")

if __name__ == '__main__':
    main()
