'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Header */}
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
        <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#111827' }}>
          About
        </h3>
      </div>

      {/* Content */}
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
          <span style={{ fontSize: '17px', color: '#9ca3af' }}>MealBrain</span>
          <span style={{ fontSize: '17px', color: '#111827' }}>1.0.0</span>
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
    </div>
  );
}
