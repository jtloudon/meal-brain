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
        backgroundColor: '#e8e6e1',
        borderTop: '1px solid #d1d5db',
        zIndex: 50,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '58px',
        paddingTop: '6px',
        paddingBottom: '6px'
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
                height: '100%',
                color: '#f97316',
                backgroundColor: isActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
                margin: '0 4px'
              }}
              aria-label={tab.name}
            >
              <Icon size={28} strokeWidth={1.5} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
