-- Create investors table for the Investment Bank application
-- Run this in the Supabase SQL editor or with psql against your database

-- Enable the extension that provides gen_random_uuid if not already enabled
-- (You can skip this if your DB already has the extension)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name varchar(100) NOT NULL,
  surname varchar(100) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  phone varchar(30),
  address text,
  date_of_birth date,
  identity_type varchar(20),
  identity_number varchar(100),
  bank_name varchar(100),
  bank_account_name varchar(255),
  bank_account_number varchar(50),
  account_number varchar(30) UNIQUE NOT NULL,
  initial_investment numeric(15,2) DEFAULT 0,
  portfolio_type varchar(100),
  investment_type varchar(100),  -- Added investment type field
  total_paid numeric(15,2) DEFAULT 0,  -- Track total amount paid to investor
  pin_hash varchar(255),
  status varchar(20) DEFAULT 'pending',
  paystack_reference varchar(100),  -- To track Paystack transaction reference
  payment_status varchar(20) DEFAULT 'pending',  -- Track payment status
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: a trigger to update "updated_at" on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_investors_updated_at ON investors;
CREATE TRIGGER trg_update_investors_updated_at
BEFORE UPDATE ON investors
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create a table to temporarily store investor data before payment confirmation
CREATE TABLE IF NOT EXISTS pending_investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_data jsonb NOT NULL,  -- Store all investor data as JSON
  paystack_reference varchar(100) UNIQUE NOT NULL,  -- Reference to Paystack transaction
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour')  -- Expire after 1 hour
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investors_email ON investors(email);
CREATE INDEX IF NOT EXISTS idx_investors_account_number ON investors(account_number);
CREATE INDEX IF NOT EXISTS idx_investors_paystack_reference ON investors(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_pending_investors_reference ON pending_investors(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_pending_investors_expires ON pending_investors(expires_at);