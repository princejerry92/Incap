-- Add current_week column to investors table
-- This column will track the current week of the investment period

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS current_week integer DEFAULT 0;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_investors_current_week ON investors(current_week);
