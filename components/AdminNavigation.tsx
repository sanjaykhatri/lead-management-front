'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationsBell from './NotificationsBell';

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
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
          isActive('/admin/dashboard')
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        Leads
      </Link>
      <Link
        href="/admin/service-providers"
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
          isActive('/admin/service-providers')
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        Service Providers
      </Link>
      <Link
        href="/admin/locations"
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
          isActive('/admin/locations')
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        Locations
      </Link>
      <Link
        href="/admin/plans"
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
          isActive('/admin/plans')
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        Plans
      </Link>
      <Link
        href="/admin/analytics"
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
          isActive('/admin/analytics')
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        Analytics
      </Link>
      <Link
        href="/admin/users"
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
          isActive('/admin/users')
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        Users
      </Link>
      <Link
        href="/admin/settings"
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
          isActive('/admin/settings')
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        Settings
      </Link>
    </>
  );

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">
              Admin Dashboard
            </h1>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-4">
            <NotificationsBell />
            <button
              onClick={handleExportCsv}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
            >
              Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
            >
              Logout
            </button>
          </div>

          {/* Mobile burger */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="hidden sm:flex sm:space-x-8 h-10 items-end">
          {navLinks}
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-200 pb-3">
            <div className="pt-2 flex flex-col space-y-1">
              {navLinks}
            </div>
            <div className="mt-3 flex flex-col space-y-2 border-t border-gray-100 pt-3">
              <button
                onClick={handleExportCsv}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium text-left"
              >
                Export CSV
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-gray-700 px-4 py-2 text-sm font-medium text-left hover:bg-gray-100 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

