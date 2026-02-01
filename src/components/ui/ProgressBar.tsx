'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * ProgressBar - Progress indicator for long operations
 * 
 * Features:
 * - Smooth progress animations
 * - Estimated time remaining
 * - Percentage display
 * - Pulsing for indeterminate progress
 * - Multiple variants (bar, circle, spinner)
 * 
 * Usage:
 * <ProgressBar progress={45} total={100} label="Extraction IA..." />
 * <ProgressBar indeterminate label="Traitement..." />
 * <ProgressBar variant="circle" progress={75} />
 */

interface ProgressBarProps {
  /** Current progress (0-100 or custom total) */
  progress?: number;
  /** Total value (default 100) */
  total?: number;
  /** Display label */
  label?: string;
  /** Indeterminate mode (pulsing animation) */
  indeterminate?: boolean;
  /** Variant style */
  variant?: 'bar' | 'circle' | 'spinner';
  /** Show percentage */
  showPercentage?: boolean;
  /** Show estimated time */
  estimatedSeconds?: number;
  /** Size (small, medium, large) */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

export function ProgressBar({
  progress = 0,
  total = 100,
  label,
  indeterminate = false,
  variant = 'bar',
  showPercentage = true,
  estimatedSeconds,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = indeterminate ? 0 : Math.round((progress / total) * 100);
  const [timeRemaining, setTimeRemaining] = useState(estimatedSeconds || 0);

  // Countdown timer
  useEffect(() => {
    if (!estimatedSeconds || indeterminate) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [estimatedSeconds, indeterminate]);

  // Format time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (variant === 'spinner') {
    return <ProgressSpinner label={label} size={size} className={className} />;
  }

  if (variant === 'circle') {
    return (
      <ProgressCircle
        percentage={percentage}
        indeterminate={indeterminate}
        label={label}
        size={size}
        className={className}
      />
    );
  }

  // Default: bar variant
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Stats */}
      {(label || showPercentage || estimatedSeconds) && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700 dark:text-gray-300">{label}</span>
          <div className="flex gap-2 items-center text-gray-600 dark:text-gray-400">
            {showPercentage && !indeterminate && (
              <span className="font-medium">{percentage}%</span>
            )}
            {timeRemaining > 0 && (
              <span className="text-xs">~{formatTime(timeRemaining)}</span>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`
          w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
          ${size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2'}
        `}
      >
        <div
          className={`
            h-full rounded-full transition-all duration-300 ease-out
            ${
              indeterminate
                ? 'bg-blue-500 animate-progress-indeterminate'
                : 'bg-blue-600 dark:bg-blue-500'
            }
          `}
          style={{
            width: indeterminate ? '30%' : `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * ProgressSpinner - Simple spinner variant
 */
function ProgressSpinner({
  label,
  size,
  className,
}: {
  label?: string;
  size: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const spinnerSize = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="animate-spin text-blue-600" size={spinnerSize} />
      {label && (
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}
    </div>
  );
}

/**
 * ProgressCircle - Circular progress variant
 */
function ProgressCircle({
  percentage,
  indeterminate,
  label,
  size,
  className,
}: {
  percentage: number;
  indeterminate: boolean;
  label?: string;
  size: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const circleSize = size === 'sm' ? 40 : size === 'lg' ? 80 : 60;
  const strokeWidth = size === 'sm' ? 4 : size === 'lg' ? 8 : 6;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: circleSize, height: circleSize }}>
        {/* Background Circle */}
        <svg
          className="transform -rotate-90"
          width={circleSize}
          height={circleSize}
        >
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress Circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={indeterminate ? 0 : offset}
            className={`
              text-blue-600 dark:text-blue-500 transition-all duration-300
              ${indeterminate ? 'animate-spin' : ''}
            `}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Text */}
        {!indeterminate && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`
                font-semibold text-gray-700 dark:text-gray-300
                ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm'}
              `}
            >
              {percentage}%
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className="text-sm text-gray-700 dark:text-gray-300 text-center">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * useProgress - Hook for managing progress state
 * 
 * Usage:
 * const { progress, start, update, complete } = useProgress();
 * start();
 * update(50);
 * complete();
 */
export function useProgress(initialProgress = 0) {
  const [progress, setProgress] = useState(initialProgress);
  const [isRunning, setIsRunning] = useState(false);

  const start = () => {
    setProgress(0);
    setIsRunning(true);
  };

  const update = (newProgress: number) => {
    setProgress(newProgress);
  };

  const complete = () => {
    setProgress(100);
    setIsRunning(false);
  };

  const reset = () => {
    setProgress(0);
    setIsRunning(false);
  };

  return {
    progress,
    isRunning,
    start,
    update,
    complete,
    reset,
  };
}

/**
 * Global progress animations CSS
 */
export const ProgressStyles = `
  @keyframes progress-indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }

  .animate-progress-indeterminate {
    animation: progress-indeterminate 1.5s ease-in-out infinite;
  }
`;
