'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CookingPot, ShoppingCart, Settings } from 'lucide-react';

const tabs = [
  { name: 'Recipes', href: '/recipes', icon: CookingPot },
  { name: 'Groceries', href: '/groceries', icon: ShoppingCart },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        zIndex: 50,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '64px',
        padding: '8px',
        gap: '4px'
      }}>
        {tabs.map((tab) => {
          // Check if current path matches this tab (including sub-paths)
          const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '4px',
                padding: '8px 12px',
                color: isActive ? '#ffffff' : '#9ca3af',
                backgroundColor: isActive ? 'var(--theme-primary)' : 'transparent',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              aria-label={tab.name}
            >
              <Icon size={24} strokeWidth={2} />
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? '600' : '500',
                lineHeight: '1'
              }}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
