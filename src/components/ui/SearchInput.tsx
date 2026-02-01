'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Show/hide the search icon */
  showIcon?: boolean;
  /** Show/hide the clear button when there's a value */
  showClear?: boolean;
  /** Custom container className */
  containerClassName?: string;
}

/**
 * SearchInput - A specialized input for search functionality
 * 
 * Features:
 * - Prevents password manager interference (Dashlane, 1Password, LastPass)
 * - Suppresses hydration warnings from browser extensions
 * - Built-in search icon and optional clear button
 * - Accessible with proper ARIA attributes
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      containerClassName,
      placeholder = 'Rechercher...',
      value,
      onClear,
      showIcon = true,
      showClear = true,
      onChange,
      ...props
    },
    ref
  ) => {
    const hasValue = value !== undefined && value !== '';

    return (
      <div 
        className={cn('relative', containerClassName)}
        suppressHydrationWarning
      >
        {showIcon && (
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" 
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          type="search"
          role="searchbox"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          // Prevent password managers from interfering
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          // Prevent hydration mismatch from browser extensions
          suppressHydrationWarning
          className={cn(
            'w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-colors duration-200',
            showIcon ? 'pl-10' : 'pl-4',
            showClear && hasValue ? 'pr-10' : 'pr-4',
            className
          )}
          {...props}
        />
        {showClear && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
