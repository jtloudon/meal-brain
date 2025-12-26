'use client';

import { useState } from 'react';
import { createHousehold } from './actions';

export default function OnboardingPage() {
  const [householdName, setHouseholdName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createHousehold(householdName);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // If successful, the server action will redirect to /planner
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
          <p className="text-secondary">Let's create your household</p>
        </div>

        <form onSubmit={handleCreateHousehold} className="space-y-4">
          <div>
            <label
              htmlFor="household_name"
              className="block text-sm font-medium mb-2"
            >
              Household Name
            </label>
            <input
              id="household_name"
              name="household_name"
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="The Smith Family"
              required
              disabled={loading}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !householdName.trim()}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Household'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <p className="text-center text-sm text-secondary/60 mt-6">
          You'll be able to invite your spouse or family members later
        </p>
      </div>
    </main>
  );
}
