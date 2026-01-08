'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-client';

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    // Get invite code from URL
    const code = searchParams.get('invite');
    if (code) {
      setInviteCode(code);
      console.log('[SIGNUP] Invite code:', code);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      console.log('[SIGNUP] Creating account for:', email);

      // Sign up with email and password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Redirect to callback with invite code if present
          emailRedirectTo: inviteCode
            ? `${window.location.origin}/auth/callback?invite=${inviteCode}`
            : `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        console.error('[SIGNUP] Error:', signUpError);
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError('Account creation failed');
        return;
      }

      console.log('[SIGNUP] Success! User:', data.user.email);

      // If we have a session (auto-confirm enabled), redirect to callback
      if (data.session) {
        console.log('[SIGNUP] Session created, redirecting to callback');
        const redirectUrl = inviteCode
          ? `/auth/callback?invite=${inviteCode}`
          : `/auth/callback`;
        window.location.href = redirectUrl;
      } else {
        // Email confirmation required
        console.log('[SIGNUP] Email confirmation required');
        setError('Please check your email to confirm your account');
      }
    } catch (err) {
      console.error('[SIGNUP] Exception:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#f97316]" style={{ color: 'white' }}>
      <div className="flex flex-col items-center">
        {/* Chef's Hat Icon - matches login exactly */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-lg"
          style={{ marginBottom: '8px' }}
        >
          <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
          <line x1="6" y1="17" x2="18" y2="17" />
        </svg>

        <h1 className="text-4xl font-bold tracking-tight leading-none" style={{ color: 'white', marginBottom: '2px' }}>
          MealBrain
        </h1>

        {/* Signup Form - with proper spacing */}
        <div className="flex flex-col items-center" style={{ marginTop: '64px', width: '100%', maxWidth: '288px' }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'white' }}>
            Create Account
          </h2>

          <form onSubmit={handleSignup} className="w-full">
            <div className="w-full" style={{ marginBottom: '16px' }}>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid white',
                  color: 'white',
                  fontSize: '16px',
                  padding: '8px 4px',
                  outline: 'none',
                }}
                className="disabled:opacity-50"
              />
              <style jsx>{`
                input::placeholder {
                  color: rgba(255, 255, 255, 0.65);
                  opacity: 1;
                }
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus {
                  -webkit-text-fill-color: white !important;
                  -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
                  transition: background-color 5000s ease-in-out 0s;
                  background-color: transparent !important;
                }
              `}</style>
            </div>

            <div className="w-full" style={{ marginBottom: '16px' }}>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (8+ characters)"
                required
                minLength={8}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid white',
                  color: 'white',
                  fontSize: '16px',
                  padding: '8px 4px',
                  outline: 'none',
                }}
                className="disabled:opacity-50"
              />
            </div>

            <div className="w-full" style={{ marginBottom: '24px' }}>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                minLength={8}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid white',
                  color: 'white',
                  fontSize: '16px',
                  padding: '8px 4px',
                  outline: 'none',
                }}
                className="disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '100%',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => router.push(inviteCode ? `/login?invite=${inviteCode}` : '/login')}
              disabled={loading}
              className="font-medium disabled:opacity-50"
              style={{
                width: '100%',
                color: 'rgba(255, 255, 255, 0.8)',
                padding: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
              }}
            >
              Already have an account? Sign in
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-sm" style={{ color: 'white', width: '100%' }}>
              {error}
            </div>
          )}

          {inviteCode && (
            <p className="text-center mt-6" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontStyle: 'italic' }}>
              You'll join your household after creating your account
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#f97316]">
        <div className="text-center" style={{ color: 'white' }}>
          <div className="text-lg">Loading...</div>
        </div>
      </main>
    }>
      <SignupContent />
    </Suspense>
  );
}
