'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, X, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import Collapsible from '@/components/Collapsible';
import { faqData, categories } from './faq-data';

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqData;

    const query = searchQuery.toLowerCase();
    return faqData.filter((faq) => {
      const questionMatch = faq.question.toLowerCase().includes(query);
      const answerMatch =
        typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(query);
      return questionMatch || answerMatch;
    });
  }, [searchQuery]);

  // Group filtered FAQs by category
  const faqsByCategory = useMemo(() => {
    const grouped: Record<string, typeof faqData> = {};
    filteredFaqs.forEach((faq) => {
      if (!grouped[faq.category]) {
        grouped[faq.category] = [];
      }
      grouped[faq.category].push(faq);
    });
    return grouped;
  }, [filteredFaqs]);

  // Filter categories to only show those with matching FAQs
  const visibleCategories = categories.filter((category) => faqsByCategory[category]?.length > 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRight
              size={24}
              style={{ transform: 'rotate(180deg)', color: 'var(--theme-primary)' }}
            />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>
            Help
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Introduction */}
        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#6b7280',
            marginBottom: '20px',
          }}
        >
          Your guide to using MealBrain. Search or browse common questions below.
        </p>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 40px 12px 40px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--theme-primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6b7280',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* FAQ Sections */}
        {visibleCategories.length > 0 ? (
          visibleCategories.map((category, index) => (
            <div
              key={category}
              style={{
                marginBottom: index < visibleCategories.length - 1 ? '32px' : '0',
              }}
            >
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '16px',
                }}
              >
                {category}
              </h4>
              <div>
                {faqsByCategory[category].map((faq, faqIndex) => (
                  <Collapsible
                    key={faqIndex}
                    question={faq.question}
                    answer={faq.answer}
                    defaultOpen={false}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: '#6b7280',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
              No FAQs match your search
            </p>
            <p style={{ fontSize: '14px' }}>Try different keywords or browse all topics above</p>
          </div>
        )}
      </div>
    </div>
  );
}
