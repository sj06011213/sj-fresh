'use client'

import { useMemo, useState } from 'react'
import {
  EVENT_OWNER_EMOJIS,
  EVENT_OWNER_LABELS,
  type Event,
} from '@/lib/supabase'
import { today } from '@/lib/utils/date'
import {
  eventOccursOn,
  formatEventWhen,
  ownerBarColor,
  ownerBadgeColor,
  sortEventsWithinDay,
} from '@/lib/utils/events'
import { currentMonthKey, monthLabel, shiftMonth } from '@/lib/utils/month'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

type Cell = { date: string; inMonth: boolean; weekday: number }

function buildMonthGrid(monthKey: string): Cell[] {
  const [y, m] = monthKey.split('-').map(Number)
  const firstDay = new Date(y, m - 1, 1)
  const startWeekday = firstDay.getDay()
  const cells: Cell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m - 1, 1 - startWeekday + i)
    cells.push({
      date: dateToStr(d),
      inMonth: d.getMonth() === m - 1,
      weekday: d.getDay(),
    })
  }
  return cells
}

function formatDateLong(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(y, mo - 1, d).getDay()]
  return `${mo}월 ${d}일 (${weekday})`
}

function ownerDotColor(owner: Event['owner']): string {
  return ownerBarColor(owner)
}

export default function CalendarView({
  events,
  onEventClick,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
}) {
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const [selectedDate, setSelectedDate] = useState<string>(today())

  const todayStr = useMemo(() => today(), [])
  const cells = useMemo(() => buildMonthGrid(monthKey), [monthKey])

  const selectedEvents = useMemo(
    () =>
      events.filter((e) => eventOccursOn(selectedDate, e)).sort(sortEventsWithinDay),
    [selectedDate, events],
  )

  return (
    <>
      {/* 월 네비 */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          onClick={() => setMonthKey(shiftMonth(monthKey, -1))}
          aria-label="이전 달"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ◀
        </button>
        <span className="text-base font-semibold">{monthLabel(monthKey)}</span>
        <button
          type="button"
          onClick={() => setMonthKey(shiftMonth(monthKey, 1))}
          aria-label="다음 달"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ▶
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={
              i === 0
                ? 'text-rose-500'
                : i === 6
                  ? 'text-sky-500'
                  : 'text-zinc-400'
            }
          >
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const dayEvents = events.filter((e) => eventOccursOn(cell.date, e))
          const isToday = cell.date === todayStr
          const isSelected = cell.date === selectedDate
          const day = Number(cell.date.split('-')[2])
          const weekdayColor =
            cell.weekday === 0
              ? 'text-rose-500'
              : cell.weekday === 6
                ? 'text-sky-500'
                : ''
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => setSelectedDate(cell.date)}
              className={`flex aspect-square flex-col items-center justify-start gap-0.5 rounded-lg py-1 text-sm transition ${
                !cell.inMonth ? 'opacity-30' : ''
              } ${
                isSelected
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : isToday
                    ? 'bg-zinc-100 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              <span className={isSelected ? '' : weekdayColor}>{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className={`h-1.5 w-1.5 rounded-full ${ownerDotColor(ev.owner)}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span
                      className={`text-[9px] leading-none ${
                        isSelected ? 'text-white/80' : 'text-zinc-400'
                      }`}
                    >
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 선택된 날짜의 일정 */}
      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {formatDateLong(selectedDate)}
          {selectedEvents.length > 0 && ` · ${selectedEvents.length}건`}
        </h3>
        {selectedEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-400 dark:border-zinc-800">
            이 날엔 일정이 없어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-stretch overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <span
                  className={`w-1.5 flex-shrink-0 ${ownerBarColor(ev.owner)}`}
                />
                <button
                  type="button"
                  onClick={() => onEventClick(ev)}
                  className="flex flex-1 flex-col gap-1 px-3 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{ev.title}</span>
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${ownerBadgeColor(ev.owner)}`}
                    >
                      {EVENT_OWNER_EMOJIS[ev.owner]}{' '}
                      {EVENT_OWNER_LABELS[ev.owner]}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {formatEventWhen(ev)}
                  </span>
                  {ev.memo && (
                    <span className="line-clamp-2 text-xs text-zinc-400">
                      📝 {ev.memo}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
