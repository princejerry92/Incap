-- Add payment_counter column to tracks number of interest payments made
ALTER TABLE investors ADD COLUMN IF NOT EXISTS payment_counter integer DEFAULT 0;

-- Create index for performance on lookups
CREATE INDEX IF NOT EXISTS idx_investors_payment_counter ON investors(payment_counter);

-- Initialize payment_counter for existing records that have been paid
-- We use total_paid to estimate the counter for existing records to prevent double payment catch-up on old weeks
-- Logic: payment_counter = floor(total_paid / weekly_interest)
-- Note: This is a best-effort initialization. 
-- For strict correctness, we might rely on the log of transactions, but total_paid is a good proxy.

WITH weekly_rates AS (
    SELECT 
        i.id,
        i.initial_investment,
        i.total_paid,
        CASE 
            WHEN i.portfolio_type = 'Conservative' THEN 0.05
            WHEN i.portfolio_type = 'Balanced' THEN 0.07
            WHEN i.portfolio_type = 'Growth' THEN 0.10
            ELSE 0.05 -- Default fallback
        END as rate
    FROM investors i
    WHERE i.total_paid > 0 AND i.initial_investment > 0
)
UPDATE investors
SET payment_counter = FLOOR(wr.total_paid / GREATEST(wr.initial_investment * wr.rate, 1))
FROM weekly_rates wr
WHERE investors.id = wr.id;
