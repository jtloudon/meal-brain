'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-client';

const DEV_USERS = [
  {
    email: 'demo@mealbrain.app',
    userId: '10000000-0000-4000-8000-000000000001',
    householdId: '00000000-0000-4000-8000-000000000001',
    name: 'Demo User',
    description: 'Has recipes, preferences, full household',
  },
  {
    email: 'spouse@mealbrain.app',
    userId: '10000000-0000-4000-8000-000000000002',
    householdId: '00000000-0000-4000-8000-000000000001',
    name: 'Spouse User',
    description: 'Same household as demo',
  },
  {
    email: 'test@mealbrain.app',
    userId: '10000000-0000-4000-8000-000000000003',
    householdId: '00000000-0000-4000-8000-000000000002',
    name: 'Test User',
    description: 'Clean slate for testing',
  },
];

export default function DevLoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Dev login not available in production</p>
      </div>
    );
  }

  const handleDevLogin = async (user: typeof DEV_USERS[0]) => {
    setLoading(user.email);

    try {
      // Use server action to generate magic link and redirect
      const { devLogin } = await import('./actions');
      await devLogin(user.userId);
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Login failed');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dev Login</h1>
          <p className="text-sm text-gray-600 mt-1">
            Quick login for local development (bypasses magic link)
          </p>
        </div>

        <div className="space-y-3">
          {DEV_USERS.map((user) => (
            <button
              key={user.email}
              onClick={() => handleDevLogin(user)}
              disabled={loading !== null}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
              <div className="text-xs text-gray-500 mt-1">
                {user.description}
              </div>
              {loading === user.email && (
                <div className="text-xs text-blue-600 mt-2">Logging in...</div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            ← Back to normal login (magic link)
          </a>
        </div>
      </div>
    </div>
  );
}
