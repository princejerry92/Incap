"""
Customer Care Service
Handles customer queries and support requests
"""

import os
from typing import Dict, Any, Optional
from supabase import create_client, Client
from app.core.config import settings

class CustomerCareService:
    def __init__(self):
        """Initialize the Customer Care service with Supabase client"""
        # Use service role key to bypass RLS policies for backend operations
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            key
        )
        self.storage_bucket = "customer-attachments"

    async def submit_query(
        self,
        user_id: str,
        category: str,
        message: str,
        attachment_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Submit a customer query
        
        Args:
            user_id (str): The user ID
            category (str): Query category (financial, complaints, information)
            message (str): Query message
            attachment_url (str, optional): URL of attachment
            
        Returns:
            Dict[str, Any]: Result of the operation
        """
        try:
            # Validate category
            valid_categories = ['financial', 'complaints', 'information']
            if category not in valid_categories:
                return {
                    "success": False,
                    "error": f"Invalid category. Must be one of: {', '.join(valid_categories)}"
                }
            
            # Prepare data
            query_data = {
                "user_id": user_id,
                "category": category,
                "message": message,
                "attachment_url": attachment_url
            }
            
            # Insert into database
            result = self.supabase.table("customer_queries").insert(query_data).execute()
            
            if result.data:
                return {
                    "success": True,
                    "data": result.data[0]
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to submit query"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_user_queries(self, user_id: str) -> Dict[str, Any]:
        """
        Get all queries for a specific user
        
        Args:
            user_id (str): The user ID
            
        Returns:
            Dict[str, Any]: User queries
        """
        try:
            result = self.supabase.table("customer_queries")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .execute()
                
            return {
                "success": True,
                "data": result.data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def upload_attachment(
        self,
        user_id: str,
        file_content: bytes,
        file_name: str,
        content_type: str
    ) -> Dict[str, Any]:
        """
        Upload an attachment to Supabase Storage
        
        Args:
            user_id (str): The user ID
            file_content (bytes): File content
            file_name (str): Original file name
            content_type (str): MIME type of the file
            
        Returns:
            Dict[str, Any]: Upload result with URL
        """
        try:
            # Generate unique file name
            import uuid
            file_ext = os.path.splitext(file_name)[1]
            unique_filename = f"{user_id}/{uuid.uuid4()}{file_ext}"
            
            # Upload to storage
            result = self.supabase.storage.from_(self.storage_bucket)\
                .upload(unique_filename, file_content, {
                    "content-type": content_type,
                    "upsert": False
                })
            
            if result:
                # Get public URL
                public_url = self.supabase.storage.from_(self.storage_bucket)\
                    .get_public_url(unique_filename)
                
                return {
                    "success": True,
                    "url": public_url
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to upload attachment"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# Create singleton instance
customer_care_service = CustomerCareService()