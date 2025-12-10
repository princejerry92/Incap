-- Create customer_queries table
CREATE TABLE IF NOT EXISTS customer_queries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('financial', 'complaints', 'information')),
    message TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_queries_user_id ON customer_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_queries_category ON customer_queries(category);
CREATE INDEX IF NOT EXISTS idx_customer_queries_status ON customer_queries(status);
CREATE INDEX IF NOT EXISTS idx_customer_queries_created_at ON customer_queries(created_at);

-- Enable Row Level Security
ALTER TABLE customer_queries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own queries" ON customer_queries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queries" ON customer_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queries" ON customer_queries
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON TABLE customer_queries TO authenticated;