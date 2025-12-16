"""
Migration script to create the notifications table in Supabase.
"""
import os
import sys
from supabase import create_client
from app.core.config import settings

def migrate():
    """Create the notifications table in Supabase."""
    try:
        # Create Supabase client
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        
        # Read the SQL file
        sql_file_path = os.path.join(os.path.dirname(__file__), 'sql', 'create_notifications_table.sql')
        
        if not os.path.exists(sql_file_path):
            print(f"SQL file not found: {sql_file_path}")
            return False
            
        with open(sql_file_path, 'r') as f:
            sql_content = f.read()
        
        # Execute the SQL commands
        # Note: Supabase Python client doesn't directly support executing raw SQL
        # We'll need to use the REST API or console for this
        print("Please execute the following SQL in your Supabase SQL editor:")
        print("=" * 50)
        print(sql_content)
        print("=" * 50)
        print("\nOr run this command in your Supabase SQL editor:")
        print(f"\\i {sql_file_path}")
        
        return True
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        return False

if __name__ == "__main__":
    success = migrate()
    if success:
        print("Migration completed successfully!")
        sys.exit(0)
    else:
        print("Migration failed!")
        sys.exit(1)