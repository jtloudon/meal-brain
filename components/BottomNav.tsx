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
        alignItems: 'flex-start',
        height: '58px',
        paddingTop: '8px',
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingBottom: '6px',
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
                alignItems: 'flex-start',
                justifyContent: 'center',
                flex: 1,
                paddingTop: '6px',
                paddingBottom: '6px',
                textDecoration: 'none'
              }}
              aria-label={tab.name}
            >
              {isActive ? (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 76,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'var(--theme-primary)',
                  marginTop: -9,
                }}>
                  <Icon size={26} strokeWidth={1.5} color="#ffffff" />
                </span>
              ) : (
                <Icon size={26} strokeWidth={1.5} color="#9ca3af" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
