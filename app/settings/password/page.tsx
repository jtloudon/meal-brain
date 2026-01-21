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

            width: '36px',

            height: '36px',

            borderRadius: '50%',

            border: '2px solid var(--theme-primary)',

            backgroundColor: 'white',

            cursor: 'pointer',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center'

          }}

        >

          <ArrowLeft size={18} style={{ color: 'var(--theme-primary)', strokeWidth: 2 }} />

        </button>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
          Set Password
        </h3>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '0 8px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
            Set a password to login directly without using magic links.
          </p>

          <form onSubmit={handleSetPassword}>
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="password" className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
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
                className="w-full focus:outline-none disabled:opacity-50"
                placeholder="At least 8 characters"
                style={{
                  fontSize: '14px',
                  padding: '8px 0',
                  border: 'none',
                  borderBottom: '1px solid #d1d5db',
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label htmlFor="confirmPassword" className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>
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
                className="w-full focus:outline-none disabled:opacity-50"
                placeholder="Re-enter password"
                style={{
                  fontSize: '14px',
                  padding: '8px 0',
                  border: 'none',
                  borderBottom: '1px solid #d1d5db',
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm" style={{ marginBottom: '16px' }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--theme-primary)] text-white py-3 hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: '9999px', boxShadow: 'none', border: 'none', fontSize: '14px', marginTop: '8px' }}
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
