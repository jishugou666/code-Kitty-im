import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  className?: string;
}

const sizes: Record<string, { track: string; thumb: string }> = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'w-3.5 h-3.5 translate-x-0.5'
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5 translate-x-0.5'
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6 translate-x-0.5'
  }
};

export const Toggle = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className
}: ToggleProps) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={clsx('flex items-start gap-3', label ? 'justify-start' : 'items-center', className)}>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={clsx(
          'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
          'cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          sizes[size].track,
          checked
            ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
        )}
      >
        <motion.span
          animate={{ x: checked ? '100%' : '0%' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={clsx(
            'absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm',
            sizes[size].thumb
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
