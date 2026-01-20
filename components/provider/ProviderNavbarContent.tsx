'use client'

// Third-party Imports
import classnames from 'classnames'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

// Component Imports
import NavToggle from '@components/layout/vertical/NavToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ProviderUserDropdown from '@/components/provider/ProviderUserDropdown'
import ProviderNotificationsBell from '@/components/provider/ProviderNotificationsBell'

// MUI Imports
import { Button, Box } from '@mui/material'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const ProviderNavbarContent = () => {
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
            href="/provider/dashboard"
            variant={isActive('/provider/dashboard') ? 'contained' : 'text'}
            size="small"
          >
            My Leads
          </Button>
          <Button
            component={Link}
            href="/provider/subscription"
            variant={isActive('/provider/subscription') ? 'contained' : 'text'}
            size="small"
          >
            Subscription
          </Button>
          <Button
            component={Link}
            href="/provider/profile"
            variant={isActive('/provider/profile') ? 'contained' : 'text'}
            size="small"
          >
            Profile
          </Button>
        </Box>
      </div>
      <div className='flex items-center gap-2'>
        <ProviderNotificationsBell />
        <ProviderUserDropdown />
      </div>
    </div>
  )
}

export default ProviderNavbarContent
