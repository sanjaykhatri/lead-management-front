import * as React from 'react';
import { cn } from '@/lib/cn';

type Variant = 'default' | 'success' | 'warning' | 'info' | 'danger' | 'muted';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
        variant === 'success' && 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
        variant === 'warning' && 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200',
        variant === 'info' && 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
        variant === 'danger' && 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
        variant === 'muted' && 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200',
        className
      )}
      {...props}
    />
  );
}

