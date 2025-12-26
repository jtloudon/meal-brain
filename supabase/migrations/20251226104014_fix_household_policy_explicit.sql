-- Make household creation policy more explicit with auth.uid() check

DROP POLICY IF EXISTS "Users can create households" ON households;

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
