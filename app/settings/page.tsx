'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { ChevronRight, LogOut } from 'lucide-react';
import { createClient } from '@/lib/auth/supabase-client';

export default function SettingsPage() {
  const router = useRouter();
  const [householdName, setHouseholdName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const fetchHouseholdInfo = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || '');

        // Get household name
        const { data: userData } = await supabase
          .from('users')
          .select('household_id')
          .eq('id', user.id)
          .single();

        if (userData?.household_id) {
          const { data: householdData } = await supabase
            .from('households')
            .select('name')
            .eq('id', userData.household_id)
            .single();

          if (householdData) {
            setHouseholdName(householdData.name);
          }
        }
      }
    };

    fetchHouseholdInfo();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const settingsSections = [
    {
      title: 'Household',
      items: [
        {
          label: 'Invite Members',
          description: 'Generate invite links for family members',
          href: '/settings/invites',
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          label: 'AI Preferences',
          description: 'Household context, dietary constraints, AI style',
          href: '/settings/ai-preferences',
        },
        {
          label: 'UI Preferences',
          description: 'Customize app appearance and theme color',
          href: '/settings/ui-preferences',
        },
        {
          label: 'Set Password',
          description: 'Enable password login for standalone app',
          href: '/settings/password',
        },
        {
          label: 'Shopping List',
          description: 'Edit categories and settings',
          href: '/settings/shopping-list',
        },
        {
          label: 'Meal Planner',
          description: 'Add or remove meal type tags (e.g. dinner, breakfast, snack)',
          href: '/settings/meal-planner',
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          label: 'Import/Export',
          description: 'Backup and restore your recipes',
          href: '/settings/import-export',
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          label: 'Help',
          description: 'Learn more about MealBrain',
          href: '/settings/help',
        },
        {
          label: 'About',
          description: 'App version and information',
          href: '/settings/about',
        },
      ],
    },
  ];

  return (
    <AuthenticatedLayout title="">
      <div style={{ padding: '8px 16px 80px 16px' }}>
        {/* Household Info Banner */}
        {householdName && (
          <div style={{
            backgroundColor: '#fff7ed',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid #fed7aa'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#9a3412',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              Household
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#ea580c',
              marginBottom: '4px'
            }}>
              {householdName}
            </div>
            {userEmail && (
              <div style={{
                fontSize: '13px',
                color: '#9a3412'
              }}>
                {userEmail}
              </div>
            )}
          </div>
        )}

        {settingsSections.map((section, idx) => (
          <div key={section.title} style={{ marginBottom: idx < settingsSections.length - 1 ? '32px' : '0' }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--theme-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              {section.title}
            </h2>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb'
            }}>
              {section.items.map((item, itemIdx) => (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderBottom: itemIdx < section.items.length - 1 ? '1px solid #f3f4f6' : 'none',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#111827',
                      marginBottom: '2px'
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280'
                    }}>
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight size={20} style={{ color: '#9ca3af', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out Button */}
        <div style={{ marginTop: '32px' }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '500',
              color: '#ef4444',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
