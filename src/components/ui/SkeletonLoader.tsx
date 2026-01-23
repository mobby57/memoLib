'use client';

import React from 'react';

/**
 * SkeletonLoader - Custom skeleton loader for workspace loading
 * 
 * Features:
 * - No layout shift (CLS = 0)
 * - Smooth pulse animation
 * - Matches workspace layout exactly
 * - Multiple variants (text, card, table)
 * - Dark mode compatible
 * 
 * Usage:
 * <SkeletonLoader variant="workspace" />
 * <SkeletonLoader variant="text" width="200px" />
 * <SkeletonLoader variant="card" count={3} />
 */

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'workspace' | 'table' | 'button';
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}

export function SkeletonLoader({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((item) => (
        <div key={item} className={className}>
          {variant === 'text' && (
            <SkeletonText width={width} height={height} />
          )}
          {variant === 'card' && <SkeletonCard />}
          {variant === 'workspace' && <SkeletonWorkspace />}
          {variant === 'table' && <SkeletonTable />}
          {variant === 'button' && <SkeletonButton width={width} />}
        </div>
      ))}
    </>
  );
}

/**
 * SkeletonText - Single line skeleton
 */
function SkeletonText({ width, height }: { width?: string; height?: string }) {
  return (
    <div
      className="skeleton-pulse rounded"
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  );
}

/**
 * SkeletonCard - Card-shaped skeleton
 */
function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="skeleton-pulse rounded h-6 w-3/4" />
      <div className="skeleton-pulse rounded h-4 w-full" />
      <div className="skeleton-pulse rounded h-4 w-5/6" />
      <div className="flex gap-2 mt-4">
        <div className="skeleton-pulse rounded h-8 w-20" />
        <div className="skeleton-pulse rounded h-8 w-20" />
      </div>
    </div>
  );
}

/**
 * SkeletonButton - Button-shaped skeleton
 */
function SkeletonButton({ width }: { width?: string }) {
  return (
    <div
      className="skeleton-pulse rounded-md h-10"
      style={{ width: width || '120px' }}
    />
  );
}

/**
 * SkeletonTable - Table rows skeleton
 */
function SkeletonTable() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="flex gap-4">
          <div className="skeleton-pulse rounded h-8 w-1/4" />
          <div className="skeleton-pulse rounded h-8 w-1/2" />
          <div className="skeleton-pulse rounded h-8 w-1/4" />
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonWorkspace - Full workspace layout skeleton
 * Matches exact layout of workspace reasoning interface
 */
function SkeletonWorkspace() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton-pulse rounded-lg h-8 w-1/3" />
        <div className="skeleton-pulse rounded h-4 w-2/3" />
      </div>

      {/* State Badge */}
      <div className="skeleton-pulse rounded-full h-8 w-48" />

      {/* Main Content Card */}
      <div className="border rounded-lg p-6 space-y-4">
        {/* Section Title */}
        <div className="skeleton-pulse rounded h-6 w-1/4" />

        {/* Content Lines */}
        <div className="space-y-3">
          <div className="skeleton-pulse rounded h-4 w-full" />
          <div className="skeleton-pulse rounded h-4 w-5/6" />
          <div className="skeleton-pulse rounded h-4 w-4/5" />
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mt-4">
          <div className="skeleton-pulse rounded-lg h-20 w-1/3" />
          <div className="skeleton-pulse rounded-lg h-20 w-1/3" />
          <div className="skeleton-pulse rounded-lg h-20 w-1/3" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <div className="skeleton-pulse rounded-md h-10 w-32" />
        <div className="skeleton-pulse rounded-md h-10 w-32" />
        <div className="skeleton-pulse rounded-md h-10 w-32" />
      </div>

      {/* Facts/Contexts List */}
      <div className="space-y-3">
        <div className="skeleton-pulse rounded h-5 w-1/5" />
        {[1, 2, 3].map((item) => (
          <div key={item} className="border rounded-lg p-4">
            <div className="skeleton-pulse rounded h-4 w-3/4 mb-2" />
            <div className="skeleton-pulse rounded h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Global skeleton CSS animation
 * Add to globals.css or include here
 */
export const SkeletonStyles = `
  @keyframes skeleton-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .skeleton-pulse {
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 50%,
      #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  @media (prefers-color-scheme: dark) {
    .skeleton-pulse {
      background: linear-gradient(
        90deg,
        #2a2a2a 25%,
        #1a1a1a 50%,
        #2a2a2a 75%
      );
    }
  }
`;
