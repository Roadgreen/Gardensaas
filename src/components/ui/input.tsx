'use client';

import { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            'w-full rounded-xl px-4 py-2.5 transition-colors focus:outline-none focus:ring-1',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          style={{
            background: 'var(--surface-container-lowest)',
            border: '1px solid rgba(194, 200, 191, 0.2)',
            color: 'var(--on-surface)',
          }}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={clsx(
            'w-full rounded-xl px-4 py-2.5 transition-colors focus:outline-none focus:ring-1 cursor-pointer',
            className
          )}
          style={{
            background: 'var(--surface-container-lowest)',
            border: '1px solid rgba(194, 200, 191, 0.2)',
            color: 'var(--on-surface)',
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
