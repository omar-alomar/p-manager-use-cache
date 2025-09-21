"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/AuthContext"
import { getUnreadNotificationCountAction } from "@/actions/notifications"

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCountAction(user.id)
        setUnreadCount(count)
      } catch (error) {
        console.error("Error fetching notification count:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnreadCount()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [user])

  if (!user || isLoading) {
    return null
  }

  return (
    <div className={`notification-bell ${className}`}>
      <button
        className="notification-bell-btn"
        title="Notifications"
        onClick={() => {
          // TODO: Open notification panel
          console.log("Open notifications")
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
