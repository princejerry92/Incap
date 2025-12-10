-- Fix Foreign Key Constraint for Customer Care Feature

-- 1. Drop the incorrect foreign key constraint (referencing auth.users)
-- Note: The constraint name might vary, but usually it follows the pattern table_column_fkey
ALTER TABLE customer_queries
DROP CONSTRAINT IF EXISTS customer_queries_user_id_fkey;

-- 2. Add the correct foreign key constraint (referencing public.users)
ALTER TABLE customer_queries
ADD CONSTRAINT customer_queries_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE CASCADE;

-- 3. Update RLS policies to be consistent (optional, but good practice)
-- Since we are using a custom users table, auth.uid() might not match user_id for manual signups.
-- However, since the backend uses the service role key, it bypasses RLS.
-- We will keep the RLS enabled but ensure the table definition is correct.
