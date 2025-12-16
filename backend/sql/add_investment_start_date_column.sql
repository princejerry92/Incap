-- Add investment_start_date column to investors table
-- This column will track when the investor chose their investment type

ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS investment_start_date timestamptz;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_investors_investment_start_date ON investors(investment_start_date);