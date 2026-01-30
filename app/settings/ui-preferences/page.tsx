'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

interface ThemePreferences {
  theme_color?: string;
}

export default function UIPreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [preferences, setPreferences] = useState<ThemePreferences>({
    theme_color: '#f97316',
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences({ theme_color: data.theme_color || '#f97316' });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveThemeColor = async (color: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_color: color }),
      });

      if (res.ok) {
        setPreferences({ theme_color: color });
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 1500);

        // Reload page to apply new theme color
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (error) {
      console.error('Error saving theme color:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  const themeColors = [
    { name: 'Sky Blue', hex: '#00A0DC' },
    { name: 'Teal', hex: '#00BFA5' },
    { name: 'Ocean Blue', hex: '#0284C7' },
    { name: 'Coral', hex: '#F87171' },
    { name: 'Purple', hex: '#A78BFA' },
    { name: 'Emerald', hex: '#34D399' },
    { name: 'Light Blue', hex: '#93C5FD' },
    { name: 'Mint', hex: '#86EFAC' },
    { name: 'Yellow', hex: '#FCD34D' },
    { name: 'Slate', hex: '#64748B' },
    { name: 'Warm Gray', hex: '#78716C' },
  ];

  return (
    <AuthenticatedLayout
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: 'fit-content',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '22px',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.12)',
          padding: '0 14px 0 6px',
          height: '44px',
        }}>
          <button
            onClick={() => router.push('/settings')}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--theme-primary)',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={16} style={{ color: 'var(--theme-primary)', strokeWidth: 2 }} />
          </button>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap' }}>
            UI Preferences
          </span>
        </div>
      }
      action={
        showSaved ? (
          <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: '500' }}>
            Saved ✓
          </span>
        ) : null
      }
    >
      <div style={{ padding: '16px' }}>
        {/* Theme Color */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Theme Color
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            Customize your app's accent color
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            maxWidth: '400px'
          }}>
            {themeColors.map((color) => (
              <button
                key={color.hex}
                onClick={() => saveThemeColor(color.hex)}
                disabled={saving}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: color.hex,
                  border: (preferences.theme_color || '#f97316') === color.hex
                    ? '3px solid #111827'
                    : '1px solid #e5e7eb',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: saving ? 0.6 : 1,
                }}
                aria-label={color.name}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
