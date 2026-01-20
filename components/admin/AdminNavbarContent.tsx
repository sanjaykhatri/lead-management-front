'use client'

// Third-party Imports
import classnames from 'classnames'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

// Component Imports
import NavToggle from '@components/layout/vertical/NavToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import AdminUserDropdown from '@/components/admin/AdminUserDropdown'
import AdminNotificationsBell from '@/components/admin/AdminNotificationsBell'

// MUI Imports
import { Button, Box } from '@mui/material'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const AdminNavbarContent = () => {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        <ModeDropdown />
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          <Button
            component={Link}
            href="/admin/dashboard"
            variant={isActive('/admin/dashboard') ? 'contained' : 'text'}
            size="small"
          >
            Dashboard
          </Button>
          <Button
            component={Link}
            href="/admin/service-providers"
            variant={isActive('/admin/service-providers') ? 'contained' : 'text'}
            size="small"
          >
            Providers
          </Button>
          <Button
            component={Link}
            href="/admin/locations"
            variant={isActive('/admin/locations') ? 'contained' : 'text'}
            size="small"
          >
            Locations
          </Button>
          <Button
            component={Link}
            href="/admin/plans"
            variant={isActive('/admin/plans') ? 'contained' : 'text'}
            size="small"
          >
            Plans
          </Button>
          <Button
            component={Link}
            href="/admin/analytics"
            variant={isActive('/admin/analytics') ? 'contained' : 'text'}
            size="small"
          >
            Analytics
          </Button>
        </Box>
      </div>
      <div className='flex items-center gap-2'>
        <AdminNotificationsBell />
        <AdminUserDropdown />
      </div>
    </div>
  )
}

export default AdminNavbarContent
