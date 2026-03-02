'use client'

import { useState } from 'react'
import { updateMilestoneCompletionAction } from '@/actions/milestones'
import { formatDate } from '@/utils/dateUtils'
import { getMilestoneColorClass } from '@/utils/milestoneUtils'

interface MilestoneItemProps {
  id: number
  date: Date
  item: string
  completed: boolean
  projectId: number
}

export function MilestoneItem({ id, date, item, completed }: MilestoneItemProps) {
  const [isCompleted, setIsCompleted] = useState(completed)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggleCompletion = async () => {
    if (isUpdating) return
    
    setIsUpdating(true)
    const newCompleted = !isCompleted
    
    // Optimistic update
    setIsCompleted(newCompleted)
    
    try {
      const result = await updateMilestoneCompletionAction(id, newCompleted)
      
      if (!result.success) {
        // Revert on error
        setIsCompleted(completed)
        console.error('Failed to update milestone:', result.message)
      }
    } catch (error) {
      // Revert on error
      setIsCompleted(completed)
      console.error('Error updating milestone:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div 
      className={`milestone-detail-card ${getMilestoneColorClass(date)} ${isCompleted ? 'completed' : ''} ${isUpdating ? 'updating' : ''}`}
      onClick={handleToggleCompletion}
      style={{ cursor: 'pointer' }}
    >
      <div className="milestone-detail-date">
        {formatDate(date)}
      </div>
      <div className={`milestone-detail-item ${isCompleted ? 'strikethrough' : ''}`}>
        {item}
      </div>
    </div>
  )
}
