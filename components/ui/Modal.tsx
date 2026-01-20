'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-xl items-start justify-center px-4 py-12">
          <div
            className={cn(
              'w-full rounded-xl border border-gray-200 bg-white shadow-xl',
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {(title || description) && (
              <div className="border-b border-gray-100 px-6 py-4">
                {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
              </div>
            )}
            <div className="px-6 py-5">{children}</div>
            {footer && <div className="border-t border-gray-100 px-6 py-4">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

