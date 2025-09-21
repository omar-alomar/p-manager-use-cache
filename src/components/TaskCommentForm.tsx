"use client"

import { useState, useTransition } from "react"
import { addCommentAction } from "@/actions/comments"
import { useAuth } from "@/components/auth/AuthContext"
import { MentionAutocomplete } from "./MentionAutocomplete"

interface TaskCommentFormProps {
  taskId: string | number
}

export function TaskCommentForm({ taskId }: TaskCommentFormProps) {
  const { user } = useAuth()
  const [body, setBody] = useState("")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.email) {
      setMessage({ type: 'error', text: 'You must be logged in to comment' })
      return
    }
    
    if (!body.trim()) {
      setMessage({ type: 'error', text: 'Please enter a comment' })
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("taskId", taskId.toString())
      formData.append("email", user.email)
      formData.append("body", body)
      formData.append("userId", user.id.toString())

      const result = await addCommentAction(formData)
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setBody("")
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  return (
    <div className="comment-form-container">
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="form-group">
          <label htmlFor="comment-body" className="form-label">
            Add a comment
          </label>
          <MentionAutocomplete
            value={body}
            onChange={setBody}
            placeholder="Share your thoughts about this task... Use @username to mention someone"
            className="form-textarea"
            rows={3}
            disabled={isPending}
          />
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="btn btn-primary"
          >
            {isPending ? (
              <>
                <div className="spinner-ring"></div>
                Adding comment...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Add Comment
              </>
            )}
          </button>
        </div>
      </form>
      
      {message && (
        <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
