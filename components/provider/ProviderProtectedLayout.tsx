'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'

import Navigation from '@components/layout/vertical/Navigation'
import ProviderHeader from '@/components/provider/ProviderHeader'
import ProviderNavbar from '@/components/provider/ProviderNavbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import FullPageLoader from '@/components/common/FullPageLoader'

interface ProviderProtectedLayoutProps {
  children: ReactNode
  mode: any
  systemMode: any
}

export default function ProviderProtectedLayout({ children, mode, systemMode }: ProviderProtectedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  const isAuthRoute =
    pathname?.startsWith('/provider/login') ||
    pathname?.startsWith('/provider/signup') ||
    pathname?.startsWith('/provider/forgot-password')

  useEffect(() => {
    // Allow auth routes to render without token check
    if (isAuthRoute) {
      setAuthorized(true)
      setChecked(true)
      return
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      if (!token) {
        router.replace('/provider/login')
        setChecked(true)
        setAuthorized(false)
        return
      }

      setAuthorized(true)
    } finally {
      setChecked(true)
    }
  }, [router, isAuthRoute])

  // Public auth routes: render children directly (BlankLayout handles appearance)
  if (isAuthRoute) {
    return <>{children}</>
  }

  if (!checked) {
    return <FullPageLoader />
  }

  if (!authorized) {
    return null
  }

  return (
    <LayoutWrapper
      systemMode={systemMode}
      verticalLayout={
        <VerticalLayout navigation={<Navigation mode={mode} />} navbar={<ProviderNavbar />} footer={<VerticalFooter />}>
          {children}
        </VerticalLayout>
      }
      horizontalLayout={
        <HorizontalLayout header={<ProviderHeader />} footer={<HorizontalFooter />}>
          {children}
        </HorizontalLayout>
      }
    />
  )
}

