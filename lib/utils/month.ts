/**
 * Month-key utilities. A month-key is 'YYYY-MM' (e.g., '2026-04').
 */

export function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function currentMonthKey(): string {
  return toMonthKey(new Date())
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return toMonthKey(d)
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${y}년 ${m}월`
}
