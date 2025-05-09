/*
  # Add clan foreign key constraint
  
  1. Changes
    - Add foreign key constraint to profiles table for clan_id
    - This ensures referential integrity between profiles and clans tables
    
  2. Security
    - Add policy for authenticated users to update their own clan_id
*/

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_clan_id_fkey'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_clan_id_fkey
    FOREIGN KEY (clan_id)
    REFERENCES clans(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Add policy for users to update their own clan_id
CREATE POLICY "Users can update their own clan_id"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);