'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface PullToRefreshProps {
  children: React.ReactNode;
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start tracking if we're at the top of the page
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Only proceed if at top of page
      if (scrollTop > 0) {
        setPullDistance(0);
        return;
      }

      const touchY = e.touches[0].clientY;
      const delta = touchY - touchStartY.current;

      // Only track downward pulls
      if (delta > 0) {
        // Apply resistance curve for natural feel (higher = harder to pull)
        const resistance = 3.5;
        const distance = Math.min(delta / resistance, 100);
        setPullDistance(distance);

        // Prevent default bounce behavior on iOS (higher threshold = less likely to hijack scroll)
        if (distance > 20) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 70 && !isRefreshing) {
        setIsRefreshing(true);

        try {
          // Refresh server data
          router.refresh();

          // Visual feedback duration
          await new Promise(resolve => setTimeout(resolve, 800));
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    // Attach to container, not document
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, pullDistance, isRefreshing]);

  const showIndicator = pullDistance > 0 || isRefreshing;
  const indicatorOpacity = isRefreshing ? 1 : Math.min(pullDistance / 70, 1);
  const indicatorY = isRefreshing ? 20 : Math.max(pullDistance - 40, -40);

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        html, body {
          overscroll-behavior-y: contain;
        }
      `}</style>

      {/* Pull-to-refresh indicator */}
      {showIndicator && (
        <div
          style={{
            position: 'fixed',
            top: `${indicatorY}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999999,
            pointerEvents: 'none',
            opacity: indicatorOpacity,
            transition: isRefreshing ? 'all 0.3s ease-out' : 'opacity 0.1s ease-out',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(0, 0, 0, 0.1)',
              borderTopColor: 'var(--theme-primary)',
              borderRadius: '50%',
              animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
            }}
          />
        </div>
      )}

      {/* Page content wrapper */}
      <div ref={containerRef} style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </>
  );
}
