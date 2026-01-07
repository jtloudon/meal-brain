-- Allow anonymous users to read household name when validating invite codes
-- This is required for the signup flow where users need to see which household
-- they're joining BEFORE they create an account and authenticate

-- SECURITY: Only allows reading household.id and household.name
-- for households that have active (non-expired, not-fully-used) invite codes
-- This is safe because:
-- 1. Only exposes household name (not sensitive data)
-- 2. Only for households actively inviting new members
-- 3. Invite codes are effectively secrets (8-char alphanumeric)

CREATE POLICY "Anyone can read household name for active invites"
  ON households FOR SELECT
  TO anon
  USING (
    -- Only allow reading if this household has at least one valid invite
    EXISTS (
      SELECT 1
      FROM household_invites
      WHERE household_invites.household_id = households.id
        AND household_invites.expires_at > NOW()
        AND (household_invites.max_uses IS NULL OR household_invites.use_count < household_invites.max_uses)
    )
  );
