// Vuexy blank layout for the /provider/login page (no sidebar/topbar)

import type { ReactNode } from 'react'

import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

import { getSystemMode } from '@core/utils/serverHelpers'

export default async function ProviderLoginLayout({ children }: { children: ReactNode }) {
  const direction = 'ltr'
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
    </Providers>
  )
}

