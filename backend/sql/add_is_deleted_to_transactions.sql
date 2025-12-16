-- Add is_deleted column to transactions table for soft delete functionality
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
