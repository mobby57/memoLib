"use client";

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  size?: number; // square size in px
  className?: string;
};

export default function BrandLogo({ size = 36, className }: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-brand-600 text-white ${className ?? ''}`}
        style={{ width: size, height: size }}
      >
        <span className="font-bold">ML</span>
      </div>
    );
  }

  return (
    <Image
      src="/logo-favicon.svg"
      alt="Memolib"
      width={size}
      height={size}
      className={className}
      priority
      unoptimized
      onError={() => setErrored(true)}
    />
  );
}
