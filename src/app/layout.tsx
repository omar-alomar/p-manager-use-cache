import type { Metadata, Viewport } from "next"
import "./styles.css"
import Link from "next/link"
import { UserStatus } from "@/components/auth/UserStatus"
import { Navigation } from "@/components/navigation/Navigation"
import { MobileNavigation } from "@/components/navigation/MobileNavigation"
import { AuthProvider } from "@/components/auth/AuthContext"
import { NotificationProvider } from "@/contexts/NotificationContext"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NotificationProvider>
            <nav className="top-nav">
              <div className="nav-text-large">
                <Link href="/projects" className="nav-title-link">
                  <span className="nav-logo">Mildenberg</span>
                  <span className="nav-subtitle">α 1.1</span>
                </Link>
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
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
