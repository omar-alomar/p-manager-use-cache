"use client"

interface MentionedUserProps {
  username: string
  className?: string
}

export function MentionedUser({ username, className = "" }: MentionedUserProps) {
  return (
    <span 
      className={`mention ${className}`}
      data-username={username}
    >
      @{username}
    </span>
  )
}
