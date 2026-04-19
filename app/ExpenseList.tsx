'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  EXPENSE_CATEGORY_EMOJIS,
  EXPENSE_CATEGORY_LABELS,
  type Expense,
} from '@/lib/supabase'
import { formatKRW } from '@/lib/utils/currency'
import { formatDateLabel } from '@/lib/utils/date'
import { deleteExpense, restoreExpense } from './actions/expenses'
import EditExpenseDialog from './EditExpenseDialog'
import UndoToast from './UndoToast'

const UNDO_DURATION_MS = 5000

export default function ExpenseList({ items }: { items: Expense[] }) {
  const [editing, setEditing] = useState<Expense | null>(null)
  const [undoItem, setUndoItem] = useState<Expense | null>(null)
  const [error, setError] = useState<string | null>(null)
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
    setError(null)
    const fd = new FormData()
    fd.append('id', item.id)
    startTransition(async () => {
      try {
        await deleteExpense(fd)
        setUndoItem(item)
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        undoTimerRef.current = setTimeout(() => {
          setUndoItem(null)
          undoTimerRef.current = null
        }, UNDO_DURATION_MS)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  function handleUndo() {
    if (!undoItem) return
    setError(null)
    const fd = new FormData()
    fd.append('id', undoItem.id)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    startTransition(async () => {
      try {
        await restoreExpense(fd)
        setUndoItem(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
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
      {error && (
        <p className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          ⚠️ {error}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {grouped.map(([date, dayItems]) => (
          <li key={date} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{formatDateLabel(date)}</span>
              <span>
                {formatKRW(dayItems.reduce((sum, it) => sum + it.amount, 0))}
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
                    {formatKRW(item.amount)}
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
