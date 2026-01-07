-- Allow public (unauthenticated) users to validate invite codes
-- This is required for the signup flow where users need to validate
-- an invite code BEFORE they create an account and authenticate

CREATE POLICY "Anyone can validate invite codes"
  ON household_invites FOR SELECT
  TO anon
  USING (true);

-- Note: This allows reading invite data, but the RPC function use_invite_code
-- still requires authentication, so invites can only be *used* by authenticated users.
-- This policy only allows *validation* (checking if code exists and is valid).
