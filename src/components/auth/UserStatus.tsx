"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { logOut } from "@/actions/auth"
import { useAuth } from "@/components/auth/AuthContext"

export function UserStatus() {
  const { user, loading, logout: contextLogout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logOut()
      if (result === null) {
        // Logout was successful, update context and redirect
        contextLogout()
        router.push("/")
      } else {
        console.error("Logout failed:", result)
      }
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="user-status">
        <div className="user-info">
          <span className="user-name">Checking authentication...</span>
          <span className="user-email">Please wait</span>
          <span className="user-role">Loading...</span>
        </div>
        <button className="logout-button" disabled>
          Loading...
        </button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="user-status">
        <div className="user-info">
          <span className="user-name">Not logged in</span>
          <span className="user-email">Guest user</span>
          <span className="user-role">No access</span>
        </div>
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
