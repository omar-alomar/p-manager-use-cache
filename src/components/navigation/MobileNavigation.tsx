"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthContext"
import { logOut } from "@/actions/auth"
import { Role } from "@prisma/client"

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, loading, logout: contextLogout } = useAuth()
  const router = useRouter()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logOut()
      if (result === null) {
        // Logout was successful, update context and redirect
        contextLogout()
        router.push("/login")
      } else {
        console.error("Logout failed:", result)
        // Even if logout fails, clear local state and redirect
        contextLogout()
        router.push("/login")
      }
    } catch (error) {
      console.error("Logout failed:", error)
      // Even if logout fails, clear local state and redirect
      contextLogout()
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
      closeMenu()
    }
  }

  if (loading) {
    return (
      <div className="mobile-nav-toggle">
        <div className="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-navigation">
      <button 
        className={`mobile-nav-toggle ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
      >
        <div className="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {isOpen && (
        <div className="mobile-nav-overlay" onClick={closeMenu}>
          <nav className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <h3>Navigation</h3>
              <button 
                className="mobile-nav-close"
                onClick={closeMenu}
                aria-label="Close navigation menu"
              >
                ×
              </button>
            </div>
            
            <ul className="mobile-nav-list">
              {!user ? (
                // User is not authenticated - show limited navigation
                <>
                  <li>
                    <Link href="/login" onClick={closeMenu}>Login</Link>
                  </li>
                  <li>
                    <Link href="/signup" onClick={closeMenu}>Sign Up</Link>
                  </li>
                </>
              ) : (
                // User is authenticated - show full navigation
                <>
                  <li>
                    <Link href="/projects" onClick={closeMenu}>Projects</Link>
                  </li>
                  <li>
                    <Link href="/clients" onClick={closeMenu}>Clients</Link>
                  </li>
                  <li>
                    <Link href="/my-tasks" onClick={closeMenu}>My Tasks</Link>
                  </li>
                  <li>
                    <Link href="/tasks" onClick={closeMenu}>All Tasks</Link>
                  </li>
                  <li>
                    <Link href="/users" onClick={closeMenu}>Team</Link>
                  </li>
                  {user.role === Role.admin && (
                    <li>
                      <Link href="/admin" onClick={closeMenu}>Admin</Link>
                    </li>
                  )}
                  <li>
                    <button 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="mobile-nav-logout"
                    >
                      {isLoggingOut ? "Logging out..." : "Log out"}
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      )}
    </div>
  )
}
