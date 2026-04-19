/**
 * Returns today's date in 'YYYY-MM-DD' format (local time, not UTC).
 */
export function today(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Formats a YYYY-MM-DD date for display in a list:
 * - "오늘 4/19" if today
 * - "어제 4/18" if yesterday
 * - "4/17" otherwise
 */
export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const now = new Date()
  if (y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate()) {
    return `오늘 ${m}/${d}`
  }
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (
    y === yesterday.getFullYear() &&
    m === yesterday.getMonth() + 1 &&
    d === yesterday.getDate()
  ) {
    return `어제 ${m}/${d}`
  }
  return `${m}/${d}`
}
