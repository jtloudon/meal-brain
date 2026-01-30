'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, X, Search, ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
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
    <AuthenticatedLayout
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: 'fit-content',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '22px',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.12)',
          padding: '0 14px 0 6px',
          height: '44px',
        }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--theme-primary)',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={16} style={{ color: 'var(--theme-primary)', strokeWidth: 2 }} />
          </button>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap' }}>
            Help
          </span>
        </div>
      }
    >
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
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
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
                boxSizing: 'border-box',
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
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--theme-primary)',
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
    </AuthenticatedLayout>
  );
}
