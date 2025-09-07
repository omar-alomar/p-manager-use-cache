"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth/AuthContext"

export function Navigation() {
  const { user, loading } = useAuth()

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
        <Link href="/projects">Projects</Link>
      </li>
      <li>
        <Link href="/clients">Clients</Link>
      </li>
      <li>
        <Link href="/my-tasks">My Tasks</Link>
      </li>
      <li>
        <Link href="/tasks">All Tasks</Link>
      </li>
      <li>
        <Link href="/users">Team</Link>
      </li>
      {user.role === "admin" && (
        <li>
          <Link href="/admin">Admin</Link>
        </li>
      )}
    </ul>
  )
}
