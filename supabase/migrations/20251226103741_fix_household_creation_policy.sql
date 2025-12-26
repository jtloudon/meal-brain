-- Fix household creation policy to explicitly allow authenticated users
-- The previous policy had WITH CHECK (true) but didn't specify TO authenticated

DROP POLICY IF EXISTS "Users can create households" ON households;

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (true);
