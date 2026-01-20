'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleProps {
  question: string;
  answer: string | React.ReactNode;
  defaultOpen?: boolean;
}

export default function Collapsible({ question, answer, defaultOpen = false }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '12px',
        marginBottom: '12px',
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: '#111827',
            flex: 1,
          }}
        >
          {question}
        </span>
        {isOpen ? (
          <ChevronUp
            size={20}
            style={{ color: 'var(--theme-primary)', flexShrink: 0, marginLeft: '12px' }}
          />
        ) : (
          <ChevronDown
            size={20}
            style={{ color: '#6b7280', flexShrink: 0, marginLeft: '12px' }}
          />
        )}
      </button>

      <div
        style={{
          maxHeight: isOpen ? '1000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#374151',
            paddingTop: isOpen ? '8px' : '0',
            paddingBottom: isOpen ? '12px' : '0',
            paddingLeft: '0',
            paddingRight: '24px',
          }}
        >
          {answer}
        </div>
      </div>
    </div>
  );
}
