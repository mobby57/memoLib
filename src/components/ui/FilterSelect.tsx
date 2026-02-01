'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** Array of options to display */
  options: FilterOption[];
  /** Placeholder option (first option with empty value) */
  placeholder?: string;
  /** Show custom chevron icon */
  showChevron?: boolean;
  /** Label for accessibility */
  label?: string;
}

/**
 * FilterSelect - A specialized select for filtering functionality
 * 
 * Features:
 * - Prevents password manager interference
 * - Suppresses hydration warnings from browser extensions
 * - Consistent styling with the design system
 * - Accessible with proper ARIA attributes
 */
export const FilterSelect = forwardRef<HTMLSelectElement, FilterSelectProps>(
  (
    {
      className,
      options,
      placeholder,
      showChevron = false,
      label,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative" suppressHydrationWarning>
        {label && (
          <label className="sr-only">{label}</label>
        )}
        <select
          ref={ref}
          // Prevent password managers from interfering
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          // Prevent hydration mismatch from browser extensions
          suppressHydrationWarning
          className={cn(
            'px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'appearance-none cursor-pointer',
            'transition-colors duration-200',
            showChevron && 'pr-10',
            className
          )}
          aria-label={label}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {showChevron && (
          <ChevronDown 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" 
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

FilterSelect.displayName = 'FilterSelect';

export default FilterSelect;
