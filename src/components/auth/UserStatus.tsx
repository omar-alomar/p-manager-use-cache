"use client"

import { useEffect, useState, useCallback } from "react"
import { getCurrentUserStatus } from "@/actions/userStatus"
import { logOut } from "@/actions/auth"
import { usePathname } from "next/navigation"

type User = {
  id: number
  email: string
  role: string
  name: string
}

export function UserStatus() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()

  // Smart auth checking function
  const checkAuth = useCallback(async () => {
    try {
      const result = await getCurrentUserStatus()
      if (result.success && result.user) {
        setUser(result.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial auth check
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Update auth status on route changes
  useEffect(() => {
    checkAuth()
  }, [pathname, checkAuth])

  // Update auth status when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      // Only check if we're not loading and have a user (avoid unnecessary checks)
      if (!loading && user) {
        checkAuth()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loading, user, checkAuth])

  // Periodic health check (every 5 minutes) - only when user is logged in
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      checkAuth()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user, checkAuth])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logOut()
      // Immediately update local state - no need to wait for redirect
      setUser(null)
    } catch (error) {
      console.error("Logout failed:", error)
      setIsLoggingOut(false)
    }
  }



  if (loading) {
    return (
      <div className="user-status">
        <span className="auth-checking">Checking authentication...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="user-status">
        <span>Not logged in</span>
        <a href="/login" className="login-link">Log in</a>
      </div>
    )
  }

  return (
    <div className="user-status">
      <div className="user-info">
        <span className="user-name">{user.name}</span>
        <span className="user-email">({user.email})</span>
        <span className="user-role">Role: {user.role}</span>
      </div>

      <button 
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="logout-button"
      >
        {isLoggingOut ? "Logging out..." : "Log out"}
      </button>
    </div>
  )
}
