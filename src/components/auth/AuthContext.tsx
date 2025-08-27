"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { usePathname } from "next/navigation"
import { getCurrentUserStatus } from "@/actions/userStatus"

type User = {
  id: number
  email: string
  role: string
  name: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  checkAuth: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const checkAuth = async () => {
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
  }

  const logout = () => {
    setUser(null)
    // The actual logout will be handled by the logout action
  }

  useEffect(() => {
    checkAuth()
  }, [])

  // Check auth when route changes
  useEffect(() => {
    checkAuth()
  }, [pathname])

  // Also check auth when the window regains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      checkAuth()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Periodic auth check when user is logged in
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      checkAuth()
    }, 30 * 1000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const value = {
    user,
    loading,
    checkAuth,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
