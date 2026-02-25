"""
Verify Gmail token and print authenticated email address.
"""
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    token_path = os.path.join(base_dir, 'token.json')
    
    if not os.path.exists(token_path):
        print(f"Error: {token_path} not found.")
        return

    try:
        creds = Credentials.from_authorized_user_file(token_path)
        service = build('gmail', 'v1', credentials=creds)
        
        # Check Profile
        profile = service.users().getProfile(userId='me').execute()
        print(f"Authenticated as: {profile['emailAddress']}")
        print(f"Messages total: {profile['messagesTotal']}")
        
        # Check Aliases (SendAs)
        print("\nChecking available aliases...")
        try:
            aliases = service.users().settings().sendAs().list(userId='me').execute()
            for alias in aliases.get('sendAs', []):
                print(f"- {alias['sendAsEmail']} (Default: {alias.get('isDefault', False)})")
        except Exception as e:
            print(f"Could not list aliases (Permission issue?): {e}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
