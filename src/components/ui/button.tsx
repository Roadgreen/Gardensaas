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
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          {
            'text-white hover:opacity-90 active:opacity-80':
              variant === 'primary',
            'bg-secondary-container text-on-surface hover:opacity-90':
              variant === 'secondary',
            'hover:bg-surface-container-high':
              variant === 'ghost',
            'border-2 border-outline-variant hover:bg-surface-container-high':
              variant === 'outline',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-2.5 text-base': size === 'md',
            'px-8 py-3.5 text-lg': size === 'lg',
          },
          className
        )}
        style={variant === 'primary' ? {
          background: 'linear-gradient(135deg, #23422a, #3a5a40)',
          color: '#ffffff',
        } : {
          color: 'var(--on-surface)',
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
