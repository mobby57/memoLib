'use client';

import React, { memo } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { colors } from '@/styles/tokens/tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = memo(React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed will-change-transform';
    
    const variantStyles = {
      primary: `text-white hover:scale-105`,
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 hover:scale-105',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 hover:scale-105',
      outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 hover:scale-105',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const buttonStyle = variant === 'primary' ? {
      backgroundColor: colors.button,
      color: 'white',
    } : {};

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        style={buttonStyle}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <LoadingSpinner 
              size="sm" 
              color={variant === 'outline' ? 'gray' : 'white'} 
              className="mr-2" 
            />
            Chargement...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
));

Button.displayName = 'Button';
