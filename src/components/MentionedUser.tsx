"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface MentionedUserProps {
  username: string
  className?: string
}

export function MentionedUser({ username, className = "" }: MentionedUserProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user ID based on username
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch(`/api/users/by-name?name=${encodeURIComponent(username)}`)
        if (response.ok) {
          const user = await response.json()
          setUserId(user.id.toString())
        }
      } catch (error) {
        console.error('Error fetching user ID:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserId()
  }, [username])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (userId) {
      router.push(`/users/${userId}`)
    }
  }

  if (isLoading) {
    return (
      <span 
        className={`mention mention-loading ${className}`}
        data-username={username}
      >
        @{username}
      </span>
    )
  }

  if (!userId) {
    // If user not found, render as plain text
    return (
      <span 
        className={`mention mention-not-found ${className}`}
        data-username={username}
      >
        @{username}
      </span>
    )
  }

  return (
    <Link 
      href={`/users/${userId}`}
      className={`mention mention-link ${className}`}
      data-username={username}
      onClick={handleClick}
    >
      @{username}
    </Link>
  )
}
