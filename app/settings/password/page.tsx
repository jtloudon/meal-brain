'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-client';
import { ArrowLeft } from 'lucide-react';

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
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        gap: '12px'
      }}>
        <button
          onClick={() => router.push('/settings')}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowLeft size={22} style={{ color: 'var(--theme-primary)' }} />
        </button>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
          Set Password
        </h3>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            Set a password to login directly without using magic links.
          </p>

          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
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
                style={{ borderRadius: '9999px', fontSize: '18px' }}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
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
                style={{ borderRadius: '9999px', fontSize: '18px' }}
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
              className="w-full bg-[var(--theme-primary)] text-white py-3 text-xl hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '9999px', boxShadow: 'none' }}
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
