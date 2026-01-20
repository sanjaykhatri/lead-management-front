'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50 ring-offset-white',
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-9 px-4 text-sm',
        size === 'lg' && 'h-11 px-5 text-base',
        variant === 'primary' && 'bg-indigo-600 text-white hover:bg-indigo-700',
        variant === 'secondary' && 'bg-gray-900 text-white hover:bg-gray-800',
        variant === 'outline' &&
          'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'bg-transparent text-gray-700 hover:bg-gray-100',
        className
      )}
      {...props}
    />
  );
}

