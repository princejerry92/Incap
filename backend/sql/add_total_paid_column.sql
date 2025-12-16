-- Script to add total_paid column to existing investors table
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS total_paid numeric(15,2) DEFAULT 0;