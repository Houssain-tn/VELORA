import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const PULL_THRESHOLD = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh if we are at the very top of the scrollable area
      if (container.scrollTop === 0 && !isRefreshing) {
        setStartY(e.touches[0].clientY);
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      const y = e.touches[0].clientY;
      const dy = y - startY;

      // If pulling down
      if (dy > 0) {
        // Optional: e.preventDefault() here if we want to strictly stop native bounce,
        // but modern browsers might complain if not passive: false
        setCurrentY(dy);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      setIsPulling(false);

      if (currentY > PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setCurrentY(50); // Hold it at 50px while refreshing

        try {
          // Refetch all active queries
          await queryClient.refetchQueries({ type: 'active' });
        } finally {
          setIsRefreshing(false);
          setCurrentY(0);
        }
      } else {
        // Reset if didn't reach threshold
        setCurrentY(0);
      }
    };

    // We must use passive: false on touchmove to conditionally prevent default if needed, 
    // but here we just read values.
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, currentY, isPulling, isRefreshing, queryClient]);

  // Use a logarithmic function to add resistance to the pull
  const translateY = isPulling ? Math.min(currentY * 0.4, 100) : (isRefreshing ? 50 : 0);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 w-full overflow-y-auto relative h-full no-scrollbar pb-24 md:pb-6"
    >
      {/* Pull Indicator */}
      <div 
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-card shadow-lg border text-primary z-50 transition-all",
          !isPulling && !isRefreshing && "duration-300 ease-out opacity-0 -translate-y-full"
        )}
        style={{
          transform: `translate(-50%, ${translateY - 50}px)`,
          opacity: Math.min(translateY / 30, 1)
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <ArrowDown 
            className="w-5 h-5 text-primary transition-transform duration-200" 
            style={{ transform: `rotate(${currentY > PULL_THRESHOLD ? 180 : 0}deg)` }}
          />
        )}
      </div>

      <div 
        className={cn(
          "w-full min-h-full transition-transform",
          (!isPulling) && "duration-300 ease-out"
        )}
        style={{ transform: `translateY(${translateY}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
