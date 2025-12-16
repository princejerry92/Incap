-- Create table for server-sent events/cards for dashboard
CREATE TABLE IF NOT EXISTS public.server_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('text', 'picture', 'notification')),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for active events
CREATE INDEX IF NOT EXISTS idx_server_events_active ON public.server_events (is_active DESC, created_at DESC);

-- Insert sample events for testing (optional)
INSERT INTO public.server_events (event_type, title, content, is_active) VALUES
('text', 'Special Promo!', 'Enjoy 5% bonus on your next investment renewal.', true),
('notification', 'System Update', 'Important: New security features added to your account.', true),
('text', 'Sales Event', 'Limited time: Get extra referrals bonus points!', true)
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_server_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_update_server_events_updated_at
    BEFORE UPDATE ON public.server_events
    FOR EACH ROW EXECUTE FUNCTION public.update_server_events_updated_at();
