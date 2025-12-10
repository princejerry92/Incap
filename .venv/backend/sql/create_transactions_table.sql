-- Create transactions table for recording all transaction activities
-- This table tracks initial investments from investors table and subsequent transactions

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  account_number varchar(30) NOT NULL,
  initial_balance numeric(15,2) DEFAULT 0,
  portfolio_type varchar(100),
  investment_type varchar(100),  -- Added investment type field
  investment_duration_months int,
  amount_due numeric(15,2) DEFAULT 0,
  last_due_date date,
  next_due_date date,
  total_paid numeric(15,2) DEFAULT 0,
  withdrawal_requested boolean DEFAULT false,
  withdraw_status varchar(20) DEFAULT 'none',  -- none, pending, failed, sent
  withdrawal_amount numeric(15,2) DEFAULT 0 --cannot be greater than amount due
  failure_reason text,
  transaction_id varchar(100) UNIQUE,  -- Unique transaction identifier
  paystack_ref varchar(100),
  paystack_status varchar(20),  -- pending, success, failed, etc.
  transaction_type varchar(20) NOT NULL,  --  payment, withdrawal Request,Renewal,Top up
  amount numeric(15,2) DEFAULT 0,
  withdrawal_timestamp timestamptz,
  paystack_timestamp timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Foreign key to investors table
  investor_id uuid REFERENCES investors(id) ON DELETE CASCADE
);

-- Trigger to update updated_at on transactions table
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_transactions_updated_at ON transactions;
CREATE TRIGGER trg_update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE update_transactions_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(email);
CREATE INDEX IF NOT EXISTS idx_transactions_account_number ON transactions(account_number);
CREATE INDEX IF NOT EXISTS idx_transactions_paystack_ref ON transactions(paystack_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_investor_id ON transactions(investor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_withdraw_status ON transactions(withdraw_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);