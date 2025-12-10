-- Fix Foreign Key Constraint for Notifications Feature

-- 1. Drop the incorrect foreign key constraint (referencing investors)
-- Note: The constraint name might vary, but usually it follows the pattern table_column_fkey
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_investor_id_fkey;

-- 2. Add the correct foreign key constraint (referencing investors)
-- Keep notifications tied to investor profiles as they relate to investment activities
ALTER TABLE notifications
ADD CONSTRAINT notifications_investor_id_fkey
FOREIGN KEY (investor_id)
REFERENCES investors(id)
ON DELETE CASCADE;
