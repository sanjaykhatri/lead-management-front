'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'

import Navigation from '@components/layout/vertical/Navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminNavbar from '@/components/admin/AdminNavbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import FullPageLoader from '@/components/common/FullPageLoader'

interface AdminProtectedLayoutProps {
  children: ReactNode
  mode: any
  systemMode: any
}

export default function AdminProtectedLayout({ children, mode, systemMode }: AdminProtectedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  const isAuthRoute = pathname?.startsWith('/admin/login')

  useEffect(() => {
    // Allow auth routes (login) to render without token check
    if (isAuthRoute) {
      setAuthorized(true)
      setChecked(true)
      return
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      if (!token) {
        router.replace('/admin/login')
        setChecked(true)
        setAuthorized(false)
        return
      }

      setAuthorized(true)
    } finally {
      setChecked(true)
    }
  }, [router, isAuthRoute])

  // For auth routes, just render children (BlankLayout handles appearance)
  if (isAuthRoute) {
    return <>{children}</>
  }

  // While checking auth, show full-page loader
  if (!checked) {
    return <FullPageLoader />
  }

  // If not authorized we already redirected; don't render layout
  if (!authorized) {
    return null
  }

  return (
    <LayoutWrapper
      systemMode={systemMode}
      verticalLayout={
        <VerticalLayout navigation={<Navigation mode={mode} />} navbar={<AdminNavbar />} footer={<VerticalFooter />}>
          {children}
        </VerticalLayout>
      }
      horizontalLayout={
        <HorizontalLayout header={<AdminHeader />} footer={<HorizontalFooter />}>
          {children}
        </HorizontalLayout>
      }
    />
  )
}

