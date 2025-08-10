import type { Metadata } from "next"
import "./styles.css"
import Link from "next/link"
import { UserStatus } from "@/components/auth/UserStatus"

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
        <nav className="top-nav">
          <div className="nav-text-large nav-list">
            <Link href="/projects">My App</Link>
          </div>
          <ul className="nav-list">
            <li>
              <Link href="/projectsTable">Projects</Link>
            </li>
            <li>
              <Link href="/users">Team</Link>
            </li>
            <li>
              <Link href="/tasks">Tasks</Link>
            </li>
            <li>
              <Link href="/login">Login</Link>
            </li>
          </ul>
          <div className="user-status-container">
            <UserStatus />
          </div>
        </nav>
        <div className="container">{children}</div>
      </body>
    </html>
  )
}
