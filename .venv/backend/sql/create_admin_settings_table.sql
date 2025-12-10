-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    username TEXT PRIMARY KEY,
    otp_hash TEXT,
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default admin user if not exists
INSERT INTO admin_settings (username)
VALUES ('admin')
ON CONFLICT (username) DO NOTHING;
