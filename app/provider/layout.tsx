// Vuexy (starter) dashboard layout integration for our /provider routes

import type { ReactNode } from 'react'

import Providers from '@components/Providers'
import ScrollToTop from '@core/components/scroll-to-top'

import Button from '@mui/material/Button'

import ProviderProtectedLayout from '@/components/provider/ProviderProtectedLayout'

import { getMode, getSystemMode } from '@core/utils/serverHelpers'

export default async function ProviderLayout({ children }: { children: ReactNode }) {
  const direction = 'ltr'
  const mode = await getMode()
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <ProviderProtectedLayout mode={mode} systemMode={systemMode}>
        {children}
      </ProviderProtectedLayout>
      <ScrollToTop className='mui-fixed'>
        <Button variant='contained' className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'>
          <i className='tabler-arrow-up' />
        </Button>
      </ScrollToTop>
    </Providers>
  )
}

