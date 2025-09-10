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
