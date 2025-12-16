-- Create topups table for the Investment Bank application
-- This table tracks all top-up transactions made by investors

CREATE TABLE IF NOT EXISTS topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES investors(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL,
  paystack_reference varchar(100) UNIQUE,
  paystack_status varchar(20) DEFAULT 'pending',
  transaction_id varchar(100) UNIQUE,
  payment_method varchar(50),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topups_investor_id ON topups(investor_id);
CREATE INDEX IF NOT EXISTS idx_topups_paystack_ref ON topups(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_topups_transaction_id ON topups(transaction_id);
CREATE INDEX IF NOT EXISTS idx_topups_created_at ON topups(created_at);

-- Trigger to update updated_at on topups table
CREATE OR REPLACE FUNCTION update_topups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_topups_updated_at ON topups;
CREATE TRIGGER trg_update_topups_updated_at
BEFORE UPDATE ON topups
FOR EACH ROW
EXECUTE PROCEDURE update_topups_updated_at();