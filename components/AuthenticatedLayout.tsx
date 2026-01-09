'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase-client';
import BottomNav from './BottomNav';
import FloatingAIButton from './FloatingAIButton';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  title: string | React.ReactNode;
  action?: React.ReactNode;
}

export default function AuthenticatedLayout({
  children,
  title,
  action,
}: AuthenticatedLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

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
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 bg-white z-40 flex-shrink-0">
        <div className="flex justify-between items-center px-4 py-2">
          <div style={{ flex: 1 }}>
            {typeof title === 'string' ? (
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            ) : (
              title
            )}
          </div>
          <div className="flex items-center gap-2">
            {action}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {children}
      </main>

      {/* Floating AI Button */}
      <FloatingAIButton />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
