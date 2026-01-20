'use client';

import * as React from 'react';
import AdminNavigation from '@/components/AdminNavigation';
import { cn } from '@/lib/cn';

export function AdminShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <main className={cn('mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8', className)}>
        {children}
      </main>
    </div>
  );
}

