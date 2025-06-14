/*
  # Reddit OAuth Integration Tables

  1. New Tables
    - `reddit_credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `reddit_username` (text)
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted)
      - `expires_at` (timestamp)
      - `scope` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reddit_credentials` table
    - Add policy for users to manage their own Reddit credentials
    - Add indexes for performance

  3. Functions
    - Add trigger for updating `updated_at` timestamp
*/

-- Create reddit_credentials table
CREATE TABLE IF NOT EXISTS reddit_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reddit_username text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  scope text NOT NULL DEFAULT 'read',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one Reddit account per user
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE reddit_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own Reddit credentials
CREATE POLICY "Users can manage their own Reddit credentials"
  ON reddit_credentials
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reddit_credentials_user_id ON reddit_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_reddit_credentials_expires_at ON reddit_credentials(expires_at);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reddit_credentials_updated_at
  BEFORE UPDATE ON reddit_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();