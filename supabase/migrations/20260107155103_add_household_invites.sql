-- Create household invites table for invitation-only signup
CREATE TABLE household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

-- Create table to track invite usage
CREATE TABLE household_invite_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES household_invites(id) ON DELETE CASCADE,
  used_by UUID NOT NULL REFERENCES auth.users(id),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_household_invites_code ON household_invites(invite_code);
CREATE INDEX idx_household_invites_household ON household_invites(household_id);
CREATE INDEX idx_invite_uses_invite ON household_invite_uses(invite_id);

-- Enable RLS
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invite_uses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for household_invites
CREATE POLICY "Users can view their household invites"
  ON household_invites FOR SELECT
  TO authenticated
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can create invites for their household"
  ON household_invites FOR INSERT
  TO authenticated
  WITH CHECK (household_id = public.user_household_id());

CREATE POLICY "Users can delete their household invites"
  ON household_invites FOR DELETE
  TO authenticated
  USING (household_id = public.user_household_id());

-- RLS Policies for household_invite_uses
CREATE POLICY "Users can view their household invite uses"
  ON household_invite_uses FOR SELECT
  TO authenticated
  USING (
    invite_id IN (
      SELECT id FROM household_invites
      WHERE household_id = public.user_household_id()
    )
  );

-- Function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No confusing chars
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and use invite code
CREATE OR REPLACE FUNCTION use_invite_code(code TEXT, user_id UUID)
RETURNS UUID AS $$
DECLARE
  invite_record household_invites%ROWTYPE;
BEGIN
  -- Find valid invite
  SELECT * INTO invite_record
  FROM household_invites
  WHERE invite_code = code
    AND expires_at > NOW()
    AND (max_uses IS NULL OR use_count < max_uses);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Increment use count
  UPDATE household_invites
  SET use_count = use_count + 1
  WHERE id = invite_record.id;

  -- Record usage
  INSERT INTO household_invite_uses (invite_id, used_by)
  VALUES (invite_record.id, user_id);

  -- Return household_id
  RETURN invite_record.household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
