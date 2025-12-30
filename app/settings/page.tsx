'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const settingsSections = [
    {
      title: 'Preferences',
      items: [
        {
          label: 'AI Preferences',
          description: 'Household context, dietary constraints, AI style',
          href: '/settings/preferences',
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          label: 'Shopping List',
          description: 'Edit categories and settings',
          href: '/settings/shopping-list',
        },
        {
          label: 'Meal Planner',
          description: 'Week start day and meal settings',
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
    <AuthenticatedLayout
      title={
        <span style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#f97316',
          backgroundColor: '#fff7ed',
          padding: '4px 12px',
          borderRadius: '8px'
        }}>
          MealBrain
        </span>
      }
    >
      <div style={{ padding: '8px 16px 80px 16px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '24px'
        }}>
          Settings
        </h1>

        {settingsSections.map((section, idx) => (
          <div key={section.title} style={{ marginBottom: idx < settingsSections.length - 1 ? '32px' : '0' }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280',
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
      </div>
    </AuthenticatedLayout>
  );
}
