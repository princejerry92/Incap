-- Create customer_queries table
CREATE TABLE customer_queries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  category VARCHAR(50) NOT NULL CHECK (category IN ('financial', 'complaints', 'information')),
  message TEXT NOT NULL,
  attachment_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_customer_queries_user_id ON customer_queries(user_id);
CREATE INDEX idx_customer_queries_category ON customer_queries(category);
CREATE INDEX idx_customer_queries_status ON customer_queries(status);
CREATE INDEX idx_customer_queries_created_at ON customer_queries(created_at);

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