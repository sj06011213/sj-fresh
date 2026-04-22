import type { Event, EventOwner } from '@/lib/supabase'

const DAY_MS = 24 * 60 * 60 * 1000

export function ownerBarColor(owner: EventOwner): string {
  switch (owner) {
    case 'me':
      return 'bg-pink-400'
    case 'partner':
      return 'bg-sky-400'
    case 'both':
      return 'bg-yellow-400'
  }
}

export function ownerBadgeColor(owner: EventOwner): string {
  switch (owner) {
    case 'me':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
    case 'partner':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
    case 'both':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
  }
}

export function formatEventTime(t: string | null): string {
  if (!t) return '종일'
  const [h, m] = t.split(':')
  const hour = Number(h)
  const ampm = hour < 12 ? '오전' : '오후'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${ampm} ${displayHour}:${m}`
}

export function formatShortDate(dateStr: string): string {
  const [, mo, d] = dateStr.split('-').map(Number)
  return `${mo}/${d}`
}

export function daysBetween(start: string, end: string): number {
  const [ys, ms, ds] = start.split('-').map(Number)
  const [ye, me, de] = end.split('-').map(Number)
  const s = new Date(ys, ms - 1, ds).getTime()
  const e = new Date(ye, me - 1, de).getTime()
  return Math.round((e - s) / DAY_MS) + 1
}

export function formatEventWhen(ev: Event): string {
  if (ev.end_date && ev.end_date !== ev.event_date) {
    const days = daysBetween(ev.event_date, ev.end_date)
    return `${formatShortDate(ev.event_date)} ~ ${formatShortDate(ev.end_date)} · ${days}일간`
  }
  return formatEventTime(ev.event_time)
}

/** 날짜 문자열에 해당 일정이 걸쳐있는지 — 기간 일정이면 start~end 범위 포함 */
export function eventOccursOn(dateStr: string, ev: Event): boolean {
  if (ev.end_date && ev.end_date !== ev.event_date) {
    return dateStr >= ev.event_date && dateStr <= ev.end_date
  }
  return ev.event_date === dateStr
}

/** 같은 날 안 정렬: 종일 먼저, 그 다음 시간순 */
export function sortEventsWithinDay(a: Event, b: Event): number {
  if (a.event_time === null && b.event_time === null) return 0
  if (a.event_time === null) return -1
  if (b.event_time === null) return 1
  return a.event_time.localeCompare(b.event_time)
}
