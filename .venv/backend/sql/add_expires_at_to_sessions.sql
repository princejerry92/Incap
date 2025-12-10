-- Add missing expires_at column to sessions table
-- This fixes the PGRST204 error where PostgREST schema cache can't find the column

-- Add the expires_at column with default value
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '6 hours');

-- Create index on expires_at for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Update any existing sessions that might have null expires_at (though unlikely since column is new)
-- This ensures all sessions have a valid expiration time
UPDATE sessions SET expires_at = now() + interval '6 hours' WHERE expires_at IS NULL;
