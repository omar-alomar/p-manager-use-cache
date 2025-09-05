"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
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

  const checkAuth = async () => {
    try {
      setLoading(true)
      console.log("Checking auth...")
      
      // Add a reasonable timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 10000)
      )
      
      const result = await Promise.race([
        getCurrentUserStatus(),
        timeoutPromise
      ]) as { success: boolean; user?: User }
      
      console.log("Auth result:", result)
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
      console.log("Auth check complete, loading set to false")
    }
  }

  const logout = () => {
    setUser(null)
    setLoading(false)
    // The actual logout will be handled by the logout action
  }

  // Only check auth once on mount
  useEffect(() => {
    checkAuth()
  }, [])

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

