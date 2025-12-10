-- Add due date columns to investors table for proper due date tracking
-- These columns will store the next and last due dates for each investor

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS next_due_date date;

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS last_due_date date;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investors_next_due_date ON investors(next_due_date);
CREATE INDEX IF NOT EXISTS idx_investors_last_due_date ON investors(last_due_date);
