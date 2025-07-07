import type { Metadata } from "next"
import "./styles.css"
import Link from "next/link"

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
              <Link href="/projects">Projects</Link>
            </li>
            <li>
              <Link href="/users">Team</Link>
            </li>
            <li>
              <Link href="/tasks">Tasks</Link>
            </li>
          </ul>
        </nav>
        <div className="container">{children}</div>
      </body>
    </html>
  )
}
