// Vuexy blank layout for the /admin/login page (no sidebar/topbar)

import type { ReactNode } from 'react'

// Component Imports (from Vuexy starter-kit)
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Util Imports (from Vuexy starter-kit)
import { getSystemMode } from '@core/utils/serverHelpers'

export default async function AdminLoginLayout({ children }: { children: ReactNode }) {
  const direction = 'ltr'
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
    </Providers>
  )
}

