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
        setMessage({ type: 'success', text: result.message || 'Comment added successfully' })
        setBody("")
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  return (
    <div className="comment-form-container">
      {message && (
        <div className={`comment-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="comment-form">
        <div className="form-group">
          <MentionAutocomplete
            value={body}
            onChange={setBody}
            placeholder="Add a comment... Use @username to mention someone"
            className="form-textarea"
            rows={3}
            disabled={isPending}
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="comment-submit-btn"
        >
          {isPending ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  )
}
