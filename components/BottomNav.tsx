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
        bottom: 'calc(12px + env(safe-area-inset-bottom))',
        left: '16px',
        right: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '28px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.06)',
        zIndex: 50,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '60px',
        paddingLeft: '12px',
        paddingRight: '12px',
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
                  width: 72,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: 'var(--theme-primary)',
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
