'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-client';

function LoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [usePassword, setUsePassword] = useState(true); // Default to password login (will change if invite detected)
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    // Check if invite code is in URL
    const code = searchParams.get('invite');
    if (code) {
      setInviteCode(code);
      setUsePassword(false); // New users from invites should use magic link by default
      console.log('[LOGIN] Invite code detected:', code, '- defaulting to magic link');
    }
  }, [searchParams]);

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings/password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password reset link sent! Check your email.');
        setShowForgotPassword(false);
      }
    } catch (err) {
      setError('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const supabase = createClient();

      if (usePassword && password) {
        // Password login
        console.log('[LOGIN] Attempting password login', inviteCode ? `with invite code: ${inviteCode}` : '');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('[LOGIN] Password error:', error);
          setError(error.message);
        } else if (data.user) {
          console.log('[LOGIN] Password success');
          console.log('[LOGIN] Session:', data.session);
          console.log('[LOGIN] Cookies:', document.cookie);

          // If invite code present, redirect to callback with invite for processing
          // Otherwise go straight to recipes
          const redirectUrl = inviteCode
            ? `/auth/callback?invite=${inviteCode}`
            : '/recipes';
          window.location.href = redirectUrl;
        }
      } else {
        // Magic link login
        console.log('[LOGIN] Sending magic link', inviteCode ? `with invite code: ${inviteCode}` : '');
        const redirectUrl = inviteCode
          ? `${window.location.origin}/auth/callback?invite=${inviteCode}`
          : `${window.location.origin}/auth/callback`;

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          console.error('[LOGIN] Magic link error:', error);
          setError(error.message);
        } else {
          setMessage('Check your email for the magic link!');
          setEmail('');
        }
      }
    } catch (err) {
      console.error('[LOGIN] Exception:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--theme-primary)]" style={{ color: 'white' }}>
      <div className="flex flex-col items-center">
        {/* Chef's Hat Icon - matches splash exactly */}
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

        {/* Login Form - with proper spacing */}
        <div className="flex flex-col items-center" style={{ marginTop: '64px', width: '100%', maxWidth: '288px' }}>
          <form onSubmit={handleLogin} className="w-full">
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

            {usePassword && (
              <>
                <div className="w-full" style={{ marginBottom: '8px' }}>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required={usePassword}
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
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  style={{
                    fontSize: '14px',
                    color: 'white',
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    opacity: loading ? 0.5 : 0.8,
                  }}
                >
                  Forgot password?
                </button>
              </>
            )}

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
              {loading ? 'Signing in...' : usePassword ? 'Sign In' : 'Send Magic Link'}
            </button>

            <button
              type="button"
              onClick={() => setUsePassword(!usePassword)}
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
              {usePassword ? 'Use magic link instead' : 'Sign in with password'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-sm" style={{ color: 'white', width: '100%' }}>
              {error}
            </div>
          )}

          <p className="text-center mt-6" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontStyle: 'italic' }}>
            {message || "We'll send you a magic link to sign in without a password"}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--theme-primary)]">
        <div className="text-center" style={{ color: 'white' }}>
          <div className="text-lg">Loading...</div>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
