export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

export function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDateTime(date: Date | string) {
  return `${formatDate(date)} · ${formatTime(date)}`
}

export function formatQueueDuration(since: Date | string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 60000))
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours}h${remainder ? ` ${remainder}m` : ''}`
}

// Coarser than formatQueueDuration — collapses to minutes/hours/days, matching the
// "3 hours" / "1 day" labels used across the dashboards.
export function formatElapsed(since: Date | string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 60000))
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'}`
}

export function formatHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  employed: 'Employed',
  self_employed: 'Self Employed',
}

export function formatEmploymentType(type: string | null) {
  return type ? (EMPLOYMENT_LABELS[type] ?? type) : '—'
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  business_loan: 'Business Loan',
  personal_loan: 'Personal Loan',
}

export function formatLoanType(type: string | null) {
  return type ? (LOAN_TYPE_LABELS[type] ?? type) : '—'
}
