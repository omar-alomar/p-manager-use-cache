import { getTaskComments } from "@/db/comments"
import { CommentItem } from "@/components/CommentItem"
import { notFound } from "next/navigation"

interface TaskCommentsProps {
  taskId: string
}

export async function TaskComments({ taskId }: TaskCommentsProps) {
  try {
    const comments = await getTaskComments(taskId)

    if (comments.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3 className="empty-title">No comments yet</h3>
          <p className="empty-description">Be the first to share your thoughts about this task!</p>
        </div>
      )
    }

    return (
      <div className="comments-container">
        <div className="external-comments">
          <div className="comments-list">
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in TaskComments:', error)
    return (
      <div className="error-state">
        <p className="error-message">Error loading comments</p>
      </div>
    )
  }
}
