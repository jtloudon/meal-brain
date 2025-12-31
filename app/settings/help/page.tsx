'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PlaceholderPage() {
  const router = useRouter();
  const pageName = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
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
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowLeft size={22} style={{ color: '#f97316' }} />
        </button>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', textTransform: 'capitalize' }}>
          {pageName?.replace('-', ' ')}
        </h3>
      </div>
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Coming soon...</p>
      </div>
    </div>
  );
}
