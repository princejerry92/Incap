-- Script to add next_due_date column to existing transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS next_due_date date;