"use client"

import { useState, useTransition } from "react"
import { deleteCommentAction } from "@/actions/comments"
import { useAuth } from "@/components/auth/AuthContext"
import { formatDate } from "@/utils/dateUtils"
import { CommentText } from "./CommentText"

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

  const canDelete = user && (user.role === 'admin' || user.id === comment.userId)

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

  return (
    <div className="comment-item">
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="author-info">
            <span className="author-name">{comment.user.name}</span>
            <span className="author-email">{comment.email}</span>
          </div>
        </div>
        <div className="comment-meta">
          <span className="comment-date">
            {formatDate(comment.createdAt, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  )
}
