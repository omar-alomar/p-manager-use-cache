'use client'

import { useState } from 'react'
import { updateMilestoneCompletionAction } from '@/actions/milestones'
import { formatDate } from '@/utils/dateUtils'

interface MilestoneItemProps {
  id: number
  date: Date
  item: string
  completed: boolean
  projectId: number
}

export function MilestoneItem({ id, date, item, completed, projectId }: MilestoneItemProps) {
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

  // Calculate milestone color class based on date proximity
  const getMilestoneColorClass = (milestoneDate: Date) => {
    const now = new Date()
    const milestone = new Date(milestoneDate)
    const diffTime = milestone.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 14) {
      return 'milestone-urgent' // Red - within 2 weeks
    } else if (diffDays <= 30) {
      return 'milestone-warning' // Yellow - within a month
    } else {
      return 'milestone-safe' // Green - more than a month
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
