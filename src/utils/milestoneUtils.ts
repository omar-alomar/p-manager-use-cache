export function getMilestoneColorClass(milestoneDate: Date | null): string {
  if (!milestoneDate) return 'milestone-neutral'

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

export function isMoreThan7DaysPast(date: Date | null): boolean {
  if (!date) return false
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 7
}

export function filterRecentMilestones<T extends { date: Date | null; completed?: boolean }>(milestones: T[] | undefined): T[] {
  if (!milestones || milestones.length === 0) return []

  return milestones.filter(milestone => milestone.date && !isMoreThan7DaysPast(milestone.date) && !milestone.completed)
}

export function getNearestMilestoneDate(milestones: { date: Date | null; completed?: boolean }[] | undefined, fallbackMilestone: Date | null): Date | null {
  // First filter out milestones more than 7 days past or completed
  const recentMilestones = filterRecentMilestones(milestones)

  if (recentMilestones.length === 0) {
    // If no recent milestones, check if fallback is also too old
    if (fallbackMilestone && isMoreThan7DaysPast(fallbackMilestone)) {
      return null
    }
    return fallbackMilestone
  }

  const now = new Date()
  // Normalize to UTC midnight for date-only comparison (milestone dates are stored in UTC)
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const futureMilestones = recentMilestones.filter(milestone => {
    if (!milestone.date) return false
    const milestoneDate = new Date(milestone.date)
    const milestoneDateUTC = new Date(Date.UTC(milestoneDate.getUTCFullYear(), milestoneDate.getUTCMonth(), milestoneDate.getUTCDate()))
    return milestoneDateUTC >= todayUTC
  })

  if (futureMilestones.length === 0) {
    // If no future dates, return the most recent past date (within 7 days)
    const validMilestones = recentMilestones.filter(m => m.date)
    if (validMilestones.length === 0) return null
    return validMilestones.reduce((nearest, current) => {
      if (!nearest.date || !current.date) return nearest
      return new Date(current.date) > new Date(nearest.date) ? current : nearest
    }).date
  }

  // Return the nearest future date
  const validFutureMilestones = futureMilestones.filter(m => m.date)
  if (validFutureMilestones.length === 0) return null
  return validFutureMilestones.reduce((nearest, current) => {
    if (!nearest.date || !current.date) return nearest
    return new Date(current.date) < new Date(nearest.date) ? current : nearest
  }).date
}
