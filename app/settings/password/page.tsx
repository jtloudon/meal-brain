'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-client';

export default function PasswordSettingsPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const supabase = createClient();

      // Update user password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password set successfully! You can now use password login.');
        setPassword('');
        setConfirmPassword('');

        // Redirect back to settings after 2 seconds
        setTimeout(() => router.push('/settings'), 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Orange bar */}
      <header className="sticky top-0 bg-[var(--theme-primary)] z-10">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-white/80"
            style={{ fontSize: '14px', fontWeight: '500' }}
          >
            ← Back
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-white">Set Password</h1>
          <div style={{ width: '60px' }} /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2 text-gray-900">Enable Password Login</h2>
          <p className="text-gray-600 text-sm">
            Set a password to login directly without using magic links.
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent disabled:opacity-50"
              placeholder="At least 8 characters"
              style={{ borderRadius: '9999px' }}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent disabled:opacity-50"
              placeholder="Re-enter password"
              style={{ borderRadius: '9999px' }}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--theme-primary)] text-white py-3 font-medium hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: '9999px' }}
          >
            {loading ? 'Setting Password...' : 'Set Password'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-semibold text-sm mb-2 text-gray-900">How to use password login:</h3>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Set your password here</li>
            <li>On the login page, click "Sign in with password"</li>
            <li>Enter your email and password</li>
            <li>Works great for the app!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
