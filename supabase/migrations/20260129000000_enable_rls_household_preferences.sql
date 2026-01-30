-- Enable RLS on household_preferences (was missing from original migration)
ALTER TABLE public.household_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their household preferences"
ON public.household_preferences
FOR ALL
USING (household_id = public.user_household_id())
WITH CHECK (household_id = public.user_household_id());
