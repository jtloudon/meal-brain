-- Restrict household creation to users who don't already have one
-- Prevents authenticated users from spamming household creation

DROP POLICY "Users can create households" ON households;

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND household_id IS NOT NULL)
  );
