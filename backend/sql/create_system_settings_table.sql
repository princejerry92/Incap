-- Create table for system-wide settings/flags (Key-Value store)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert initial events flag
INSERT INTO public.system_settings (key, value)
VALUES ('events_update_flag', 'false')
ON CONFLICT (key) DO NOTHING;
