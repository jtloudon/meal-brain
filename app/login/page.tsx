'use client';

import { useState } from 'react';
import { createClient } from '@/lib/auth/supabase-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LOGIN] Form submitted, email:', email);
    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[LOGIN] Creating Supabase client...');
      const supabase = createClient();
      console.log('[LOGIN] Supabase client created, calling signInWithOtp...');

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('[LOGIN] signInWithOtp response:', { error });

      if (error) {
        console.error('[LOGIN] Error from Supabase:', error);
        setError(error.message);
      } else {
        console.log('[LOGIN] Success! Setting success message');
        setMessage('Check your email for the magic link!');
        setEmail('');
      }
    } catch (err) {
      console.error('[LOGIN] Caught exception:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#f97316]" style={{ color: 'white' }}>
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
            <div className="w-full" style={{ marginBottom: '24px' }}>
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
              }}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
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
