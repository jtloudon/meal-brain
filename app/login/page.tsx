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
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">MealBrain</h1>
          <p className="text-secondary">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <p className="text-center text-sm text-secondary/60 mt-6">
          We'll send you a magic link to sign in without a password
        </p>
      </div>
    </main>
  );
}
