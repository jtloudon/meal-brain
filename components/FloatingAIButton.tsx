'use client';

import { useState } from 'react';
import AIChatPanel from '../app/components/AIChatPanel';

export default function FloatingAIButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleClick = () => {
    console.log('Chef hat clicked, opening panel...');
    setIsPanelOpen(true);
    console.log('isPanelOpen set to:', true);
  };

  return (
    <>
      <button
      onClick={handleClick}
      aria-label="Open AI Assistant"
      style={{
        position: 'fixed',
        bottom: 'calc(88px + env(safe-area-inset-bottom))', // Above floating nav
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #FF6B35 0%, #FF4B9E 50%, #9B59B6 100%)',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'box-shadow 0.2s',
        zIndex: 40,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      {/* Chef's Hat Icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
        <line x1="6" y1="17" x2="18" y2="17" />
      </svg>
    </button>

      <AIChatPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
}
