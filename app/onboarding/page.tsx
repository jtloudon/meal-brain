'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createHousehold } from './actions';

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if invite code is in URL
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code.toUpperCase());
      validateInviteCode(code.toUpperCase());
    }
  }, [searchParams]);

  const validateInviteCode = async (code: string) => {
    setValidatingCode(true);
    setError('');

    try {
      const response = await fetch('/api/invites/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await response.json();

      if (data.valid) {
        setCodeValid(true);
        setHouseholdName(data.householdName || '');
      } else {
        setCodeValid(false);
        setError(data.error || 'Invalid invite code');
      }
    } catch (err) {
      setCodeValid(false);
      setError('Failed to validate invite code');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      await validateInviteCode(inviteCode.toUpperCase());
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Join household using invite code
      const result = await createHousehold('', inviteCode);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // If successful, the server action will redirect to /recipes
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to MealBrain!</h1>
          <p className="text-secondary">
            {codeValid ? 'Join your household' : 'Enter your invite code'}
          </p>
        </div>

        {!codeValid ? (
          <form onSubmit={handleValidateCode} className="space-y-4">
            <div>
              <label
                htmlFor="invite_code"
                className="block text-sm font-medium mb-2"
              >
                Invite Code
              </label>
              <input
                id="invite_code"
                name="invite_code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                required
                disabled={validatingCode}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 font-mono text-center text-lg uppercase"
                maxLength={8}
                style={{ letterSpacing: '0.1em' }}
              />
            </div>

            <button
              type="submit"
              disabled={validatingCode || !inviteCode.trim()}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validatingCode ? 'Validating...' : 'Validate Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinHousehold} className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 text-center">
                You're joining: <strong>{householdName}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Household'}
            </button>

            <button
              type="button"
              onClick={() => {
                setCodeValid(false);
                setInviteCode('');
                setHouseholdName('');
              }}
              className="w-full text-sm text-secondary underline"
            >
              Use a different code
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <p className="text-center text-sm text-secondary/60 mt-6">
          Ask your family member for an invite code to get started
        </p>
      </div>
    </main>
  );
}
