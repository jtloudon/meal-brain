'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if already shown in this session
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('splash-shown');
      if (alreadyShown) {
        setIsVisible(false);
        return;
      }
    }

    // Mark as shown and hide after delay
    sessionStorage.setItem('splash-shown', 'true');
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 h-screen w-screen z-50 flex flex-col items-center justify-center bg-[var(--theme-primary)] transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        pointerEvents: isVisible ? 'auto' : 'none',
        color: 'white'
      }}
    >
      <div className="flex flex-col items-center animate-subtle-zoom gap-0">
        {/* Chef's Hat Icon */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-lg mb-2"
        >
          {/* Chef's hat crown */}
          <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
          {/* Hat band */}
          <line x1="6" y1="17" x2="18" y2="17" />
        </svg>

        {/* App Name */}
        <h1 className="text-4xl font-bold tracking-tight leading-none" style={{ color: 'white', marginBottom: '2px' }}>
          MealBrain
        </h1>

        {/* Tagline */}
        <p className="text-center px-8 max-w-md" style={{ color: 'white', marginTop: '2px', fontSize: '13px', fontStyle: 'italic', lineHeight: '1.3' }}>
          An AI sous chef you control - helpful, never bossy
        </p>
      </div>
    </div>
  );
}
