-- Add referral_code column to users table
ALTER TABLE users ADD COLUMN referral_code VARCHAR(8) UNIQUE;

-- Create index for referral code lookups
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- Create user_referrals table to track referral relationships
CREATE TABLE user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code_used VARCHAR(8),
  points_awarded INTEGER DEFAULT 10,
  investor_account_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referrer_id, referee_id)
);

-- Create indexes for user_referrals
CREATE INDEX idx_user_referrals_referrer_id ON user_referrals(referrer_id);
CREATE INDEX idx_user_referrals_referee_id ON user_referrals(referee_id);
CREATE INDEX idx_user_referrals_code_used ON user_referrals(referral_code_used);

-- Create user_points table to track points balance and redemptions
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  last_redemption_date DATE,
  monthly_redemption_count INTEGER DEFAULT 0,
  last_redemption_month DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes for user_points
CREATE INDEX idx_user_points_user_id ON user_points(user_id);

-- Trigger to update updated_at on user_points table
CREATE OR REPLACE FUNCTION update_user_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_user_points_updated_at ON user_points;
CREATE TRIGGER trg_update_user_points_updated_at
BEFORE UPDATE ON user_points
FOR EACH ROW
EXECUTE PROCEDURE update_user_points_updated_at();
