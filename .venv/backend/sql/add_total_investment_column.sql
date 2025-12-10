-- Add total_investment column to investors table
-- This column will track the total investment including top-ups

ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS total_investment numeric(15,2) DEFAULT 0;