'use client';

import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0D1F17] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          {
            'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 active:from-green-700 active:to-emerald-700 shadow-lg shadow-green-600/20 dark:shadow-green-900/30':
              variant === 'primary',
            'bg-green-50 dark:bg-[#1A2F23] text-green-800 dark:text-green-100 hover:bg-green-100 dark:hover:bg-[#243D2E] border border-green-200 dark:border-green-800/50':
              variant === 'secondary',
            'text-gray-600 dark:text-green-300 hover:text-green-700 dark:hover:text-green-100 hover:bg-green-50 dark:hover:bg-green-900/30':
              variant === 'ghost',
            'border-2 border-green-500 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white':
              variant === 'outline',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-2.5 text-base': size === 'md',
            'px-8 py-3.5 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
