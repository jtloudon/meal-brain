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
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                padding: '10px',
                color: isActive ? 'var(--theme-primary)' : '#9ca3af',
                textDecoration: 'none'
              }}
              aria-label={tab.name}
            >
              <Icon
                size={26}
                strokeWidth={2}
                fill={isActive ? 'var(--theme-primary)' : 'none'}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
