'use client'

import { useRef, useState, useTransition } from 'react'
import {
  EVENT_OWNERS,
  EVENT_OWNER_EMOJIS,
  EVENT_OWNER_LABELS,
  type EventOwner,
} from '@/lib/supabase'
import { today } from '@/lib/utils/date'
import { addEvent } from './actions/events'
import AutoResizeTextarea from './AutoResizeTextarea'
import Modal from './Modal'

const HOURS_24 = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0'),
)
const MINUTES_10 = ['00', '10', '20', '30', '40', '50'] as const

export default function AddEventButton() {
  const [open, setOpen] = useState(false)
  const [owner, setOwner] = useState<EventOwner>('both')
  const [allDay, setAllDay] = useState(false)
  const [multiDay, setMultiDay] = useState(false)
  const [hour, setHour] = useState('09')
  const [minute, setMinute] = useState('00')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    formData.set('all_day', allDay ? 'true' : 'false')
    formData.set('multi_day', multiDay ? 'true' : 'false')
    if (!allDay && !multiDay) formData.set('event_time', `${hour}:${minute}`)
    startTransition(async () => {
      try {
        await addEvent(formData)
        formRef.current?.reset()
        setOwner('both')
        setAllDay(false)
        setMultiDay(false)
        setHour('09')
        setMinute('00')
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  function openModal() {
    setOwner('both')
    setAllDay(false)
    setMultiDay(false)
    setHour('09')
    setMinute('00')
    setError(null)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="일정 추가"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-3xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
      >
        +
      </button>

      {open && (
        <Modal title="🗓️ 일정 추가" onClose={() => setOpen(false)}>
          <form
            ref={formRef}
            action={handleSubmit}
            className="flex flex-col gap-3"
          >
            <input
              name="title"
              required
              autoFocus
              maxLength={80}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
            />

            <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              {EVENT_OWNERS.map((o) => (
                <label
                  key={o}
                  className={`flex cursor-pointer flex-col items-center rounded-md px-2 py-2 text-xs font-medium transition ${
                    owner === o
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                      : 'text-zinc-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="owner"
                    value={o}
                    checked={owner === o}
                    onChange={() => setOwner(o)}
                    className="sr-only"
                  />
                  <span className="text-lg">{EVENT_OWNER_EMOJIS[o]}</span>
                  <span>{EVENT_OWNER_LABELS[o]}</span>
                </label>
              ))}
            </div>

            <label
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              onClick={(e) => {
                const input = e.currentTarget.querySelector<HTMLInputElement>(
                  'input[type="date"]',
                )
                try {
                  input?.showPicker?.()
                } catch {
                  // showPicker not available or blocked
                }
              }}
            >
              <span className="text-zinc-500">
                {multiDay ? '시작일' : '날짜'}
              </span>
              <input
                name="event_date"
                type="date"
                defaultValue={today()}
                required
                className="flex-1 bg-transparent outline-none"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black">
              <input
                type="checkbox"
                checked={multiDay}
                onChange={(e) => {
                  setMultiDay(e.target.checked)
                  if (e.target.checked) setAllDay(false)
                }}
                className="h-4 w-4"
              />
              📆 기간 일정 (여러 날)
            </label>

            {multiDay && (
              <label
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector<HTMLInputElement>(
                    'input[type="date"]',
                  )
                  try {
                    input?.showPicker?.()
                  } catch {
                    // noop
                  }
                }}
              >
                <span className="text-zinc-500">종료일</span>
                <input
                  name="end_date"
                  type="date"
                  defaultValue={today()}
                  required={multiDay}
                  className="flex-1 bg-transparent outline-none"
                />
              </label>
            )}

            {!multiDay && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="h-4 w-4"
                />
                🌙 종일 (시간 없음)
              </label>
            )}

            {!multiDay && !allDay && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>시간</span>
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
                >
                  {HOURS_24.map((h) => (
                    <option key={h} value={h}>
                      {h}시
                    </option>
                  ))}
                </select>
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
                >
                  {MINUTES_10.map((m) => (
                    <option key={m} value={m}>
                      {m}분
                    </option>
                  ))}
                </select>
              </div>
            )}

            <AutoResizeTextarea
              name="memo"
              placeholder="메모 (선택)"
              rows={2}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-black"
            />

            {error && (
              <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 rounded-lg bg-emerald-600 py-3 text-base font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? '저장 중...' : '저장'}
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
