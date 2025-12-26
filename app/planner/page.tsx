'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-client';

export default function PlannerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Get household info
      const { data: userRecord } = await supabase
        .from('users')
        .select('household_id, households(name)')
        .eq('id', user.id)
        .single();

      if (userRecord) {
        setHousehold(userRecord.households);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="animate-pulse">
          <p className="text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meal Planner</h1>
            {household && (
              <p className="text-secondary text-sm mt-1">{household.name}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Log out
          </button>
        </div>

        <div className="bg-gray-50 border-2 border-dashed rounded-lg p-12 text-center">
          <p className="text-secondary">
            Planner UI coming in Phase 2
          </p>
          <p className="text-sm text-secondary/60 mt-2">
            You're successfully authenticated!
          </p>
          {user && (
            <p className="text-xs text-secondary/40 mt-4">
              Logged in as: {user.email}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
