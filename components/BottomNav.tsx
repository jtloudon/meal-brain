'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CookingPot, ShoppingCart, Settings } from 'lucide-react';

const tabs = [
  { name: 'Recipes', href: '/recipes', icon: CookingPot },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'Groceries', href: '/groceries', icon: ShoppingCart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff' }}
    >
      <div className="flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label={tab.name}
            >
              <Icon size={24} strokeWidth={2} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
