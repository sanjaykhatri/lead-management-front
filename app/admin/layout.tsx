// Vuexy (starter-kit) dashboard layout integration for our /admin routes

// Type Imports
import type { ReactNode } from 'react'

// Component Imports (from Vuexy starter-kit)
import Providers from '@components/Providers'
import ScrollToTop from '@core/components/scroll-to-top'

import Button from '@mui/material/Button'

import AdminProtectedLayout from '@/components/admin/AdminProtectedLayout'

// Util Imports (from Vuexy starter-kit)
import { getMode, getSystemMode } from '@core/utils/serverHelpers'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const direction = 'ltr'
  const mode = await getMode()
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <AdminProtectedLayout mode={mode} systemMode={systemMode}>
        {children}
      </AdminProtectedLayout>
      <ScrollToTop className='mui-fixed'>
        <Button variant='contained' className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'>
          <i className='tabler-arrow-up' />
        </Button>
      </ScrollToTop>
    </Providers>
  )
}

