-- Add password_hash column to users table for manual signups
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar(255);
