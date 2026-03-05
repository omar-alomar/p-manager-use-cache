"use client"

import { useState, useTransition } from "react"
import { deleteCommentAction } from "@/actions/comments"
import { useAuth } from "@/components/auth/AuthContext"
import { formatDate } from "@/utils/dateUtils"
import { CommentText } from "./CommentText"
import { Role } from "@prisma/client"
import { avatarColorClass } from "@/utils/avatarColor"

interface Comment {
  id: number
  email: string
  body: string
  userId: number
  createdAt: Date
  user: {
    id: number
    name: string
    role: string
  }
}

interface CommentItemProps {
  comment: Comment
}

export function CommentItem({ comment }: CommentItemProps) {
  const { user } = useAuth()
  const [isDeleting, startTransition] = useTransition()
  const [isDeleted, setIsDeleted] = useState(false)

  const canDelete = user && (user.role === Role.admin || user.id === comment.userId)

  const handleDelete = async () => {
    if (!user || !canDelete) return

    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("commentId", comment.id.toString())
      formData.append("userId", user.id.toString())
      formData.append("userRole", user.role)

      const result = await deleteCommentAction(formData)

      if (result.success) {
        setIsDeleted(true)
      } else {
        alert(result.message || 'Failed to delete comment')
      }
    })
  }

  if (isDeleted) {
    return null
  }

  const initials = comment.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="comment-item">
      <div className={`author-avatar ${avatarColorClass(comment.user.name)}`}>
        <span style={{ fontSize: 11, fontWeight: 600 }}>{initials}</span>
      </div>
      <div className="comment-item-content">
        <div className="comment-header">
          <div className="author-info">
            <span className="author-name">{comment.user.name}</span>
            <span className="comment-date">
              {formatDate(comment.createdAt, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="comment-meta">
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="comment-delete-btn"
                title="Delete comment"
              >
                {isDeleting ? (
                  <div className="spinner-ring"></div>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="comment-body">
          <CommentText text={comment.body} />
        </div>
      </div>
    </div>
  )
}
