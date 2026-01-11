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
  const startY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    let touchStartY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      startY.current = touchStartY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only trigger pull-to-refresh if we're at the top of the page
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
      if (currentScrollTop > 0) {
        isPulling.current = false;
        setPullDistance(0);
        return;
      }

      const touchY = e.touches[0].clientY;
      const pullDelta = touchY - startY.current;

      // Only count as pulling if we're pulling down and at top of page
      if (pullDelta > 0 && currentScrollTop === 0) {
        isPulling.current = true;
        // Apply resistance to pull distance (feel more natural)
        const resistance = 2.5;
        const distance = Math.min(pullDelta / resistance, 80);
        setPullDistance(distance);

        // Prevent default scrolling when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling.current && pullDistance > 60 && !isRefreshing) {
        // Trigger refresh
        setIsRefreshing(true);
        setPullDistance(0);

        try {
          // Refresh server data without full page reload
          router.refresh();

          // Give visual feedback for at least 500ms
          await new Promise(resolve => setTimeout(resolve, 500));
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }

      isPulling.current = false;
    };

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router, pullDistance, isRefreshing]);

  return (
    <>
      {/* Pull-to-refresh indicator */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isRefreshing ? 1 : pullDistance / 60,
          transform: `translateY(${isRefreshing ? '0px' : `${pullDistance - 60}px`})`,
          transition: isRefreshing ? 'transform 0.2s ease-out, opacity 0.2s ease-out' : 'none',
          pointerEvents: 'none',
          zIndex: 999998,
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid rgba(0, 0, 0, 0.1)',
            borderTopColor: 'var(--theme-primary)',
            borderRadius: '50%',
            animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
          }}
        />
      </div>

      {/* Page content */}
      {children}

      {/* Spinner animation */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
