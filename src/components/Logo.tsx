"use client";

import React from 'react';

type Props = {
  className?: string;
};

export function Logo({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 128 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="memoLib logo"
      role="img"
    >
      {/* Monogram */}
      <g>
        <rect x="0" y="4" width="32" height="24" rx="6" fill="#1D4ED8" />
        <path d="M10 22 L10 10 L14 10 L18 16 L22 10 L26 10 L26 22 L22 22 L22 16 L18 22 L14 16 L14 22 Z" fill="#FFFFFF" />
      </g>

      {/* Wordmark */}
      <g transform="translate(40, 6)">
        <text x="0" y="0" dy="1.2em" fontFamily="var(--font-playfair), serif" fontSize="14" fill="#111827">
          memo
        </text>
        <text x="44" y="0" dy="1.2em" fontFamily="var(--font-inter), sans-serif" fontWeight="600" fontSize="14" fill="#1D4ED8">
          Lib
        </text>
      </g>
    </svg>
  );
}
