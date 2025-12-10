-- Ensure spending_accounts table exists (unchanged)
CREATE TABLE IF NOT EXISTS public.spending_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES public.investors(id) ON DELETE CASCADE,
  balance numeric(15,2) DEFAULT 0,
  total_withdrawn numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index (schema-qualified)
CREATE INDEX IF NOT EXISTS idx_spending_accounts_investor_id ON public.spending_accounts(investor_id);

-- Stable search_path function: sets updated_at before update
CREATE OR REPLACE FUNCTION public.update_spending_accounts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Trigger: ensure it references the function in public schema
DROP TRIGGER IF EXISTS trg_update_spending_accounts_updated_at ON public.spending_accounts;
CREATE TRIGGER trg_update_spending_accounts_updated_at
BEFORE UPDATE ON public.spending_accounts
FOR EACH ROW
EXECUTE PROCEDURE public.update_spending_accounts_updated_at();