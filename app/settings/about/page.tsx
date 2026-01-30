'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function AboutPage() {
  const router = useRouter();

  // Get version info from environment (set by Vercel at build time)
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown';

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
            About
          </span>
        </div>
      }
    >
      <div style={{ padding: '16px' }}>
        {/* App name and version */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '17px', color: '#9ca3af' }}>Version</span>
          <span style={{ fontSize: '17px', color: '#111827' }}>{version}</span>
        </div>

        {/* Build info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '17px', color: '#9ca3af' }}>Build</span>
          <span style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>{commitSha}</span>
        </div>

        {/* Contact */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '17px', color: '#9ca3af' }}>Contact</span>
          <a
            href="mailto:jtloudon@users.noreply.github.com"
            style={{
              fontSize: '17px',
              color: '#3b82f6',
              textDecoration: 'none'
            }}
          >
            jtloudon@users.noreply.github.com
          </a>
        </div>

        {/* Copyright */}
        <div style={{
          paddingTop: '16px',
          paddingBottom: '16px'
        }}>
          <p style={{
            fontSize: '17px',
            color: '#9ca3af',
            textAlign: 'left',
            margin: 0
          }}>
            Copyright © 2025 Jesse Loudon
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
