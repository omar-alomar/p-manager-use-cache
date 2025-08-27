import type { Metadata } from "next"
import "./styles.css"
import Link from "next/link"
import { UserStatus } from "@/components/auth/UserStatus"
import { Navigation } from "@/components/navigation/Navigation"
import { AuthProvider } from "@/components/auth/AuthContext"

export const metadata: Metadata = {
  title: "Read Only Blog",
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
          <nav className="top-nav">
            <div className="nav-text-large nav-list">
              <Link href="/projects">My App</Link>
            </div>
            <Navigation />
            <div className="user-status-container">
              <UserStatus />
            </div>
          </nav>
          <div className="container">{children}</div>
        </AuthProvider>
      </body>
    </html>
  )
}
