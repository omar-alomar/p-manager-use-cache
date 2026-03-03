"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/AuthContext"
import { Role } from "@prisma/client"

export function Navigation() {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  if (loading) {
    return (
      <ul className="nav-list">
        <li>Loading...</li>
      </ul>
    )
  }

  if (!user) {
    // User is not authenticated - show limited navigation
    return (
      <ul className="nav-list">
        <li>
          <Link href="/login">Login</Link>
        </li>
        <li>
          <Link href="/signup">Sign Up</Link>
        </li>
      </ul>
    )
  }

  // User is authenticated - show full navigation
  return (
    <ul className="nav-list">
      <li>
        <Link href="/projects" className={isActive("/projects") ? "active" : ""}>Projects</Link>
      </li>
      <li>
        <Link href="/clients" className={isActive("/clients") ? "active" : ""}>Clients</Link>
      </li>
      <li>
        <Link href="/my-tasks" className={isActive("/my-tasks") ? "active" : ""}>My Tasks</Link>
      </li>
      <li>
        <Link href="/tasks" className={isActive("/tasks") ? "active" : ""}>All Tasks</Link>
      </li>
      <li>
        <Link href="/users" className={isActive("/users") ? "active" : ""}>Team</Link>
      </li>
      {user.role === Role.admin && (
        <li>
          <Link href="/admin" className={isActive("/admin") ? "active" : ""}>Admin</Link>
        </li>
      )}
    </ul>
  )
}
