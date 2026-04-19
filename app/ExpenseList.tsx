'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_EMOJIS,
  EXPENSE_CATEGORY_LABELS,
  type Expense,
  type ExpenseCategory,
} from '@/lib/supabase'
import {
  deleteExpense,
  restoreExpense,
  updateExpense,
} from './actions'
import PlaceInput from './PlaceInput'
import UndoToast from './UndoToast'

const UNDO_DURATION_MS = 5000

export default function ExpenseList({ items }: { items: Expense[] }) {
  const [editing, setEditing] = useState<Expense | null>(null)
  const [undoItem, setUndoItem] = useState<Expense | null>(null)
  const [isPending, startTransition] = useTransition()
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>()
    for (const item of items) {
      const list = map.get(item.spent_at) ?? []
      list.push(item)
      map.set(item.spent_at, list)
    }
    return Array.from(map.entries())
  }, [items])

  function handleDelete(item: Expense) {
    const fd = new FormData()
    fd.append('id', item.id)
    startTransition(async () => {
      await deleteExpense(fd)
      setUndoItem(item)
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      undoTimerRef.current = setTimeout(() => {
        setUndoItem(null)
        undoTimerRef.current = null
      }, UNDO_DURATION_MS)
    })
  }

  function handleUndo() {
    if (!undoItem) return
    const fd = new FormData()
    fd.append('id', undoItem.id)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    startTransition(async () => {
      await restoreExpense(fd)
      setUndoItem(null)
    })
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-400">
        아직 기록이 없어요.
        <br />
        오른쪽 아래 ➕ 버튼으로 지출을 기록해보세요!
      </p>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-4">
        {grouped.map(([date, dayItems]) => (
          <li key={date} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{formatDateLabel(date)}</span>
              <span>
                ₩{' '}
                {dayItems
                  .reduce((sum, it) => sum + it.amount, 0)
                  .toLocaleString('ko-KR')}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {dayItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <span
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-lg dark:bg-zinc-900"
                    aria-label={EXPENSE_CATEGORY_LABELS[item.category]}
                  >
                    {EXPENSE_CATEGORY_EMOJIS[item.category]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="flex flex-1 flex-col items-start text-left"
                  >
                    <span className="line-clamp-1 text-sm font-medium">
                      {item.description}
                    </span>
                    {(item.place || item.memo) && (
                      <span className="line-clamp-1 text-xs text-zinc-400">
                        {item.place && <>📍 {item.place}</>}
                        {item.place && item.memo && <> · </>}
                        {item.memo && <>📝 {item.memo}</>}
                      </span>
                    )}
                  </button>
                  <span className="flex-shrink-0 text-sm font-semibold tabular-nums">
                    ₩ {item.amount.toLocaleString('ko-KR')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={isPending}
                    aria-label="삭제"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {editing && (
        <EditExpenseDialog
          expense={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {undoItem && (
        <UndoToast
          key={undoItem.id}
          label={`"${undoItem.description}" 삭제됨`}
          onUndo={handleUndo}
          durationMs={UNDO_DURATION_MS}
        />
      )}
    </>
  )
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = today.getMonth() + 1
  const dd = today.getDate()
  if (y === yyyy && m === mm && d === dd) return `오늘 ${m}/${d}`
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (
    y === yesterday.getFullYear() &&
    m === yesterday.getMonth() + 1 &&
    d === yesterday.getDate()
  )
    return `어제 ${m}/${d}`
  return `${m}/${d}`
}

function EditExpenseDialog({
  expense,
  onClose,
}: {
  expense: Expense
  onClose: () => void
}) {
  const [category, setCategory] = useState<ExpenseCategory>(expense.category)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateExpense(formData)
      onClose()
    })
  }

  function handleDelete() {
    const fd = new FormData()
    fd.append('id', expense.id)
    startDeleteTransition(async () => {
      await deleteExpense(fd)
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">💰 지출 수정</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full text-2xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            ×
          </button>
        </div>

        <form
          ref={formRef}
          action={handleSubmit}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="id" value={expense.id} />

          <input
            name="description"
            placeholder="어디서/뭘 샀나요?"
            required
            defaultValue={expense.description}
            maxLength={80}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
          />

          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-black">
            <span className="text-base text-zinc-500">₩</span>
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              required
              min="0"
              step="1"
              defaultValue={expense.amount}
              className="flex-1 bg-transparent py-3 text-base outline-none"
            />
            <span className="text-sm text-zinc-500">원</span>
          </div>

          <div className="grid grid-cols-5 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            {EXPENSE_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className={`flex cursor-pointer flex-col items-center rounded-md px-1 py-2 text-[11px] font-medium transition ${
                  category === cat
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={category === cat}
                  onChange={() => setCategory(cat)}
                  className="sr-only"
                />
                <span className="text-lg">
                  {EXPENSE_CATEGORY_EMOJIS[cat]}
                </span>
                <span className="truncate">
                  {EXPENSE_CATEGORY_LABELS[cat]}
                </span>
              </label>
            ))}
          </div>

          {category === 'groceries' && (
            <PlaceInput name="place" defaultValue={expense.place ?? ''} />
          )}

          <label
            className="flex items-center gap-2 text-sm text-zinc-500"
            onClick={(e) => {
              const input = e.currentTarget.querySelector<HTMLInputElement>(
                'input[type="date"]',
              )
              try {
                input?.showPicker?.()
              } catch {
                // showPicker not available or blocked — fall back to focus
              }
            }}
          >
            날짜
            <input
              name="spent_at"
              type="date"
              defaultValue={expense.spent_at}
              required
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
            />
          </label>

          <textarea
            name="memo"
            placeholder="메모 (선택)"
            rows={2}
            defaultValue={expense.memo ?? ''}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-black"
          />

          <button
            type="submit"
            disabled={isPending || isDeleting}
            className="mt-2 rounded-lg bg-emerald-600 py-3 text-base font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            className="rounded-lg bg-rose-50 py-3 text-base font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900"
          >
            {isDeleting ? '삭제 중...' : '🗑 삭제'}
          </button>
        </form>
      </div>
    </div>
  )
}
