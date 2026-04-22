'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  EVENT_OWNER_EMOJIS,
  EVENT_OWNER_LABELS,
  type Event,
} from '@/lib/supabase'
import { today } from '@/lib/utils/date'
import {
  formatEventWhen,
  ownerBarColor,
  ownerBadgeColor,
  sortEventsWithinDay,
} from '@/lib/utils/events'
import { deleteEvent, restoreEvent } from './actions/events'
import AddEventButton from './AddEventButton'
import CalendarView from './CalendarView'
import EditEventDialog from './EditEventDialog'
import UndoToast from './UndoToast'

type Section = {
  key: string
  label: string
  events: Event[]
}

type ViewMode = 'list' | 'calendar'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
const UNDO_DURATION_MS = 5000

function formatDateHeader(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((date.getTime() - todayStart.getTime()) / DAY_MS)
  const weekday = WEEKDAYS[date.getDay()]
  const base = `${mo}/${d} (${weekday})`
  if (diffDays === 0) return `오늘 · ${base}`
  if (diffDays === 1) return `내일 · ${base}`
  if (diffDays === -1) return `어제 · ${base}`
  return base
}

function groupByDate(events: Event[]): Section[] {
  const map = new Map<string, Event[]>()
  for (const ev of events) {
    const arr = map.get(ev.event_date) ?? []
    arr.push(ev)
    map.set(ev.event_date, arr)
  }
  const sortedDates = [...map.keys()].sort()
  return sortedDates.map((date) => ({
    key: date,
    label: formatDateHeader(date),
    events: (map.get(date) ?? []).sort(sortEventsWithinDay),
  }))
}

export default function ScheduleView({ events }: { events: Event[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editing, setEditing] = useState<Event | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastDeleted, setLastDeleted] = useState<Event[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const todayStr = useMemo(() => today(), [])

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function enterSelectMode() {
    setSelectMode(true)
    setSelectedIds(new Set())
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  function toggleViewMode() {
    setViewMode((v) => (v === 'list' ? 'calendar' : 'list'))
    exitSelectMode()
  }

  function handleCardClick(ev: Event) {
    if (selectMode) toggleSelect(ev.id)
    else setEditing(ev)
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return
    const toDelete = events.filter((e) => selectedIds.has(e.id))
    setError(null)
    startTransition(async () => {
      try {
        await Promise.all(
          toDelete.map((ev) => {
            const fd = new FormData()
            fd.append('id', ev.id)
            return deleteEvent(fd)
          }),
        )
        setLastDeleted(toDelete)
        setSelectMode(false)
        setSelectedIds(new Set())
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        undoTimerRef.current = setTimeout(() => {
          setLastDeleted(null)
          undoTimerRef.current = null
        }, UNDO_DURATION_MS)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  function handleUndo() {
    if (!lastDeleted) return
    const items = lastDeleted
    setError(null)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    startTransition(async () => {
      try {
        await Promise.all(
          items.map((ev) => {
            const fd = new FormData()
            fd.append('id', ev.id)
            return restoreEvent(fd)
          }),
        )
        setLastDeleted(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  const upcoming = useMemo(
    () => events.filter((e) => e.event_date >= todayStr),
    [events, todayStr],
  )
  const past = useMemo(
    () => events.filter((e) => e.event_date < todayStr),
    [events, todayStr],
  )

  const upcomingSections = useMemo(() => groupByDate(upcoming), [upcoming])
  const pastSections = useMemo(() => groupByDate(past).reverse(), [past])

  const [showPast, setShowPast] = useState(false)

  return (
    <>
      {events.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-2 text-sm">
          {viewMode === 'list' && selectMode ? (
            <>
              <button
                type="button"
                onClick={exitSelectMode}
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
              >
                취소
              </button>
              <span className="text-zinc-500">
                {selectedIds.size}개 선택
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || isPending}
                className="rounded-lg bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700 disabled:opacity-40"
              >
                {isPending ? '삭제 중...' : `🗑 삭제 (${selectedIds.size})`}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleViewMode}
                className="rounded-lg px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {viewMode === 'list' ? '📅 달력으로 보기' : '📋 리스트로 보기'}
              </button>
              {viewMode === 'list' ? (
                <button
                  type="button"
                  onClick={enterSelectMode}
                  className="rounded-lg px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  🗑 선택 삭제
                </button>
              ) : (
                <span />
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          ⚠️ {error}
        </p>
      )}

      {events.length === 0 ? (
        <div className="py-16 text-center text-zinc-400">
          아직 등록된 일정이 없어요.
          <br />
          오른쪽 아래 + 버튼으로 첫 일정을 추가해보세요!
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView events={events} onEventClick={setEditing} />
      ) : (
        <>
          {upcomingSections.length === 0 ? (
            <p className="mb-6 rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-400 dark:border-zinc-800">
              예정된 일정이 없어요.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {upcomingSections.map((section) => (
                <DateSection
                  key={section.key}
                  section={section}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          )}

          {pastSections.length > 0 && (
            <div className="mt-8 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="mb-3 flex w-full items-center justify-between text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                <span>지난 일정 ({past.length})</span>
                <span>{showPast ? '▲ 접기' : '▼ 펼치기'}</span>
              </button>
              {showPast && (
                <div className="flex flex-col gap-5 opacity-70">
                  {pastSections.map((section) => (
                    <DateSection
                      key={section.key}
                      section={section}
                      selectMode={selectMode}
                      selectedIds={selectedIds}
                      onCardClick={handleCardClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AddEventButton />

      {editing && (
        <EditEventDialog event={editing} onClose={() => setEditing(null)} />
      )}

      {lastDeleted && lastDeleted.length > 0 && (
        <UndoToast
          key={lastDeleted.map((e) => e.id).join(',')}
          label={`${lastDeleted.length}개 일정 삭제됨`}
          onUndo={handleUndo}
          durationMs={UNDO_DURATION_MS}
        />
      )}
    </>
  )
}

function DateSection({
  section,
  selectMode,
  selectedIds,
  onCardClick,
}: {
  section: Section
  selectMode: boolean
  selectedIds: Set<string>
  onCardClick: (event: Event) => void
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {section.label}
      </h3>
      <ul className="flex flex-col gap-2">
        {section.events.map((ev) => {
          const isSelected = selectedIds.has(ev.id)
          return (
            <li
              key={ev.id}
              className={`flex items-stretch overflow-hidden rounded-xl border transition ${
                isSelected
                  ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/40'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
              }`}
            >
              <span
                className={`w-1.5 flex-shrink-0 ${ownerBarColor(ev.owner)}`}
              />
              <button
                type="button"
                onClick={() => onCardClick(ev)}
                className="flex flex-1 items-center gap-3 px-3 py-3 text-left"
              >
                {selectMode && (
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm transition ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                    aria-hidden
                  >
                    {isSelected && '✓'}
                  </span>
                )}
                <div className="flex flex-1 flex-col gap-1">
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
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
