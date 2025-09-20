/*
  # Knowledge Base Schema

  1. New Tables
    - `entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `content` (text)
      - `explanation` (text)
      - `category` (text)
      - `tags` (text[])
      - `is_favorite` (boolean)
      - `is_pinned` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `entries` table
    - Add policies for CRUD operations
*/

-- Create entries table
CREATE TABLE entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  explanation text,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own entries"
  ON entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own entries"
  ON entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE
  ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for full-text search
CREATE INDEX entries_search_idx ON entries
  USING gin(to_tsvector('english', title || ' ' || content || ' ' || explanation));