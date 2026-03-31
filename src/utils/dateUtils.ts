/**
 * Date utility functions for consistent timezone handling
 */

/**
 * Formats a date consistently across all environments
 * @param date - The date to format (can be Date object, string, or null)
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Use UTC methods to avoid timezone issues
  return dateObj.toLocaleDateString('en-US', {
    ...options,
    timeZone: 'UTC' // Force UTC to ensure consistency
  })
}

/**
 * Creates a date in UTC from year, month, day values
 * @param year - Full year (e.g., 2024)
 * @param month - Month (1-12)
 * @param day - Day of month (1-31)
 * @returns Date object in UTC
 */
export function createUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Converts a date string in MM/DD/YYYY format to UTC ISO string
 * @param dateStr - Date string in MM/DD/YYYY format
 * @returns ISO string in UTC or null if invalid
 */
export function convertToUTCISO(dateStr: string): string | null {
  if (!dateStr) return null

  const [month, day, year] = dateStr.split('/')
  if (!month || !day || !year) return null

  const yearNum = parseInt(year)
  const monthNum = parseInt(month)
  const dayNum = parseInt(day)

  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) return null

  return createUTCDate(yearNum, monthNum, dayNum).toISOString()
}

/**
 * Returns the Monday of the week containing the given date (UTC)
 */
export function getMonday(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  // day 0 = Sunday, so offset is (day + 6) % 7 to make Monday = 0
  const diff = (day + 6) % 7
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

/**
 * Returns an array of 7 Date objects (Mon-Sun) starting from the given Monday
 */
export function getWeekDays(monday: Date): Date[] {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setUTCDate(d.getUTCDate() + i)
    days.push(d)
  }
  return days
}

/**
 * Formats a Monday date as "Week of Mar 23, 2026"
 */
export function formatWeekLabel(monday: Date): string {
  return `Week of ${monday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })}`
}

/**
 * Formats a date as abbreviated day + date number, e.g. "Mon 23"
 */
export function formatDayHeader(date: Date): string {
  const day = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  const num = date.getUTCDate()
  return `${day} ${num}`
}

/**
 * Returns an ISO date string (YYYY-MM-DD) for a UTC date
 */
export function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Converts decimal hours to H:MM string, e.g. 4.5 → "4:30"
 */
export function hoursToHMM(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${m.toString().padStart(2, '0')}`
}

/**
 * Converts H:MM string to decimal hours, e.g. "4:30" → 4.5
 * Also accepts plain numbers like "4" → 4.0
 */
export function hmmToHours(hmm: string): number | null {
  if (!hmm || !hmm.trim()) return null
  const trimmed = hmm.trim()

  // Handle H:MM format
  if (trimmed.includes(':')) {
    const [hStr, mStr] = trimmed.split(':')
    const h = parseInt(hStr)
    const m = parseInt(mStr || '0')
    if (isNaN(h) || isNaN(m) || h < 0 || m < 0 || m > 59) return null
    return h + m / 60
  }

  // Handle plain number
  const num = parseFloat(trimmed)
  if (isNaN(num) || num < 0) return null
  return num
}

/**
 * Formats a date as "Friday 27th Mar", matching the Harvest style
 */
export function formatDailyDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
  const day = date.getUTCDate()
  const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })

  // Ordinal suffix
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' : 'th'

  return `${weekday} ${day}${suffix} ${month}`
}

/**
 * Returns the Saturday that starts the week containing the given date.
 * Week runs Sat-Fri to match the Harvest convention from the screenshots.
 */
export function getWeekStartSat(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() // 0=Sun, 6=Sat
  // Offset to previous Saturday: Sat=0, Sun=1, Mon=2, ... Fri=6
  const offset = (day + 1) % 7
  d.setUTCDate(d.getUTCDate() - offset)
  return d
}

/**
 * Returns 7 Date objects (Sat-Fri) starting from the given Saturday
 */
export function getWeekDaysSat(saturday: Date): Date[] {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(saturday)
    d.setUTCDate(d.getUTCDate() + i)
    days.push(d)
  }
  return days
}
