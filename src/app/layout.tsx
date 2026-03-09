import type { Metadata, Viewport } from "next"
import "./styles.css"
import Link from "next/link"
import { UserStatus } from "@/components/auth/UserStatus"
import { Navigation } from "@/components/navigation/Navigation"
import { MobileNavigation } from "@/components/navigation/MobileNavigation"
import { AuthProvider } from "@/components/auth/AuthContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { APP_VERSION } from "@/constants/version"
import { VersionBanner } from "@/components/VersionBanner"
import { isMaintenanceMode } from "@/redis/maintenance"
import { getCurrentUser } from "@/auth/currentUser"
import { Role } from "@prisma/client"

export const metadata: Metadata = {
  title: "Mildenberg Project Platform",
  description: "Project management platform for Mildenberg team",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const maintenance = await isMaintenanceMode()

  if (maintenance) {
    const user = await getCurrentUser()
    if (!user || user.role !== Role.admin) {
      return (
        <html lang="en">
          <body>
            <div className="maintenance-page">
              <svg className="maintenance-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h1>Under Maintenance</h1>
              <p>We&apos;re making some updates. The site will be back shortly.</p>
            </div>
          </body>
        </html>
      )
    }
  }

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NotificationProvider>
            <nav className="top-nav">
              <div className="nav-text-large">
                <div className="nav-title-group">
                  <Link href="/projects" className="nav-title-link">
                    <svg className="nav-logo-icon" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true">
                      <rect className="logo-border" x="16" y="16" width="148" height="148" rx="4" stroke="white" strokeWidth="14" />
                      <line className="logo-line logo-line-1" x1="68" y1="68" x2="164" y2="68" stroke="white" strokeWidth="14" strokeLinecap="round" />
                      <line className="logo-line logo-line-2" x1="112" y1="80" x2="112" y2="164" stroke="white" strokeWidth="14" strokeLinecap="round" />
                      <line className="logo-line logo-line-3" x1="112" y1="112" x2="16" y2="112" stroke="white" strokeWidth="14" strokeLinecap="round" />
                      <line className="logo-line logo-line-4" x1="68" y1="100" x2="68" y2="16" stroke="white" strokeWidth="14" strokeLinecap="round" />
                    </svg>
                    <span className="nav-logo">Mildenberg</span>
                  </Link>
                  <Link href="/changelog" className="nav-subtitle">α {APP_VERSION}</Link>
                </div>
              </div>
              <div className="nav-center">
                <Navigation />
              </div>
              <div className="user-status-container">
                <UserStatus />
                <MobileNavigation />
              </div>
            </nav>
            <div className="container">{children}</div>
            <VersionBanner />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
