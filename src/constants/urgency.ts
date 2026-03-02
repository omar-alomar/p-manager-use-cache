export const URGENCY_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

export const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Low', emoji: '\u26A0', className: 'urgency-low', color: 'var(--success-600)' },
  { value: 'MEDIUM', label: 'Medium', emoji: '\u26A0', className: 'urgency-medium', color: 'var(--warning-600)' },
  { value: 'HIGH', label: 'High', emoji: '\u26A0', className: 'urgency-high', color: 'hsl(25, 95%, 40%)' },
  { value: 'CRITICAL', label: 'Critical', emoji: '\u26A0', className: 'urgency-critical', color: 'var(--error-600)' },
] as const

/** Urgency options formatted for SearchableSelect dropdowns */
export const URGENCY_SELECT_OPTIONS = URGENCY_OPTIONS.map(({ value, emoji, label, color }) => ({
  value,
  label: `${emoji} ${label}`,
  color,
}))

export const URGENCY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Urgency' },
  { value: 'low', label: '\u26A0 Low', color: 'var(--success-600)' },
  { value: 'medium', label: '\u26A0 Medium', color: 'var(--warning-600)' },
  { value: 'high', label: '\u26A0 High', color: 'hsl(25, 95%, 40%)' },
  { value: 'critical', label: '\u26A0 Critical', color: 'var(--error-600)' },
] as const

export function getUrgencyDisplay(urgency: string | null | undefined) {
  switch (urgency) {
    case 'LOW':
      return { label: 'Low', emoji: '\u26A0', className: 'urgency-low' }
    case 'HIGH':
      return { label: 'High', emoji: '\u26A0', className: 'urgency-high' }
    case 'CRITICAL':
      return { label: 'Critical', emoji: '\u26A0', className: 'urgency-critical' }
    case 'MEDIUM':
    default:
      return { label: 'Medium', emoji: '\u26A0', className: 'urgency-medium' }
  }
}
