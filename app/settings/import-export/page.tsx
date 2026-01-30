'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function PlaceholderPage() {
  const router = useRouter();
  const pageName = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';

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
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
            {pageName?.replace('-', ' ')}
          </span>
        </div>
      }
    >
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Coming soon...</p>
      </div>
    </AuthenticatedLayout>
  );
}
