'use client'

import { useState } from 'react'
import { updateMilestoneCompletionAction, deleteMilestoneAction } from '@/actions/milestones'
import { formatDate } from '@/utils/dateUtils'
import { getMilestoneColorClass } from '@/utils/milestoneUtils'
import { EditMilestoneModal } from './EditMilestoneModal'

interface MilestoneItemProps {
  id: number
  date: Date
  item: string
  completed: boolean
  apfo?: boolean
  projectId: number
}

export function MilestoneItem({ id, date, item, completed, apfo = false, projectId }: MilestoneItemProps) {
  const [isCompleted, setIsCompleted] = useState(completed)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editKey, setEditKey] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleCompletion = async () => {
    if (isUpdating) return

    setIsUpdating(true)
    const newCompleted = !isCompleted

    // Optimistic update
    setIsCompleted(newCompleted)

    try {
      const result = await updateMilestoneCompletionAction(id, newCompleted)

      if (!result.success) {
        setIsCompleted(completed)
        console.error('Failed to update milestone:', result.message)
      }
    } catch (error) {
      setIsCompleted(completed)
      console.error('Error updating milestone:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditOpen(true)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting) return
    if (!confirm(`Are you sure you want to delete this milestone?`)) return

    setIsDeleting(true)
    try {
      const result = await deleteMilestoneAction(id)
      if (!result.success) {
        console.error('Failed to delete milestone:', result.message)
      }
    } catch (error) {
      console.error('Error deleting milestone:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditClose = () => {
    setIsEditOpen(false)
    setEditKey(prev => prev + 1)
  }

  // Format date to YYYY-MM-DD for the edit modal
  const dateStr = date instanceof Date
    ? date.toISOString().split('T')[0]
    : new Date(date).toISOString().split('T')[0]

  return (
    <>
      <div
        className={`milestone-detail-card ${getMilestoneColorClass(date)} ${isCompleted ? 'completed' : ''} ${isUpdating || isDeleting ? 'updating' : ''} ${apfo ? 'milestone-apfo' : ''}`}
        onClick={handleToggleCompletion}
        style={{ cursor: 'pointer' }}
      >
        <div className="milestone-card-actions">
          <button
            type="button"
            className="milestone-action-btn"
            onClick={handleEdit}
            title="Edit milestone"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            type="button"
            className="milestone-action-btn milestone-action-btn-danger"
            onClick={handleDelete}
            title="Delete milestone"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
        {apfo && (
          <span className="apfo-badge" title="APFO">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            APFO
          </span>
        )}
        <div className="milestone-detail-date">
          {formatDate(date)}
        </div>
        <div className={`milestone-detail-item ${isCompleted ? 'strikethrough' : ''}`}>
          {item}
        </div>
      </div>
      <EditMilestoneModal
        key={editKey}
        isOpen={isEditOpen}
        onClose={handleEditClose}
        milestoneId={id}
        initialDate={dateStr}
        initialItem={item}
        initialApfo={apfo}
      />
    </>
  )
}
