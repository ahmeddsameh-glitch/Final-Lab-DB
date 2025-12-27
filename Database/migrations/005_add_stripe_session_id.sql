-- Add stripe_session_id to orders table to prevent duplicate order creation
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255) UNIQUE;
