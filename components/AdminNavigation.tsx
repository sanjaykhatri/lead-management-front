'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowDownTrayIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import NotificationsBell from './NotificationsBell';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export default function AdminNavigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  };

  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/leads/export/csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const navLinks = (
    <>
      <Link
        href="/admin/dashboard"
        className={cn(
          'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive('/admin/dashboard')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        Dashboard
      </Link>
      <Link
        href="/admin/service-providers"
        className={cn(
          'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive('/admin/service-providers')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        Service Providers
      </Link>
      <Link
        href="/admin/locations"
        className={cn(
          'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive('/admin/locations')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        Locations
      </Link>
      <Link
        href="/admin/plans"
        className={cn(
          'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive('/admin/plans')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        Plans
      </Link>
      <Link
        href="/admin/analytics"
        className={cn(
          'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive('/admin/analytics')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        Analytics
      </Link>
      <Link
        href="/admin/users"
        className={cn(
          'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive('/admin/users')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        Users
      </Link>
      <Link
        href="/admin/settings"
        className={cn(
          'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive('/admin/settings')
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        Settings
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <span className="text-sm font-semibold">LM</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">Admin</div>
              <div className="text-xs text-gray-500">Lead Management</div>
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <NotificationsBell />
            <Button
              onClick={handleExportCsv}
              variant="outline"
              size="sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Mobile burger */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1 pb-3">
          {navLinks}
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-200 pb-3">
            <div className="pt-2 flex flex-col gap-1">
              {navLinks}
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
              <Button
                onClick={handleExportCsv}
                variant="outline"
                className="w-full justify-start"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

