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

  const colorSections = [
    {
      title: 'Reds & Pinks',
      colors: [
        { name: 'Red', hex: '#FF3B30' },
        { name: 'Coral', hex: '#FF6961' },
        { name: 'Rose', hex: '#FF2D55' },
        { name: 'Magenta', hex: '#E91E8C' },
        { name: 'Pink', hex: '#FF6B9D' },
        { name: 'Berry', hex: '#C44569' },
      ],
    },
    {
      title: 'Oranges & Yellows',
      colors: [
        { name: 'Orange', hex: '#FF9500' },
        { name: 'Tangerine', hex: '#FF6F3C' },
        { name: 'Yellow', hex: '#FFCC00' },
        { name: 'Gold', hex: '#E8A317' },
      ],
    },
    {
      title: 'Greens',
      colors: [
        { name: 'Green', hex: '#34C759' },
        { name: 'Mint', hex: '#30D158' },
        { name: 'Forest', hex: '#248A52' },
        { name: 'Teal', hex: '#00C7A8' },
      ],
    },
    {
      title: 'Blues',
      colors: [
        { name: 'Blue', hex: '#007AFF' },
        { name: 'Sky', hex: '#5AC8FA' },
        { name: 'Vivid', hex: '#0A84FF' },
        { name: 'Ocean', hex: '#1A6FC4' },
        { name: 'Indigo', hex: '#5856D6' },
      ],
    },
    {
      title: 'Purples',
      colors: [
        { name: 'Purple', hex: '#AF52DE' },
        { name: 'Plum', hex: '#8944AB' },
        { name: 'Violet', hex: '#BF5AF2' },
      ],
    },
    {
      title: 'Neutrals',
      colors: [
        { name: 'Graphite', hex: '#636366' },
        { name: 'Silver', hex: '#8E8E93' },
      ],
    },
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
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
          Customize your app&apos;s accent color
        </p>
        {colorSections.map((section) => (
          <div key={section.title} style={{ marginBottom: '20px' }}>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px'
            }}>
              {section.title}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '12px',
            }}>
              {section.colors.map((color) => (
                <div key={color.hex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => saveThemeColor(color.hex)}
                    disabled={saving}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: color.hex,
                      border: (preferences.theme_color || '#f97316') === color.hex
                        ? '3px solid #111827'
                        : '3px solid transparent',
                      boxShadow: (preferences.theme_color || '#f97316') === color.hex
                        ? '0 0 0 2px white, 0 0 0 4px #111827'
                        : 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: saving ? 0.6 : 1,
                    }}
                    aria-label={color.name}
                    title={color.name}
                  />
                  <span style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AuthenticatedLayout>
  );
}
