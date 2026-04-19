'use client'

import { useMemo, useState } from 'react'
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_EMOJIS,
  EXPENSE_CATEGORY_LABELS,
  type Expense,
  type ExpenseCategory,
} from '@/lib/supabase'
import AddExpenseButton from './AddExpenseButton'
import ExpenseList from './ExpenseList'

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return `${y}년 ${m}월`
}

function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return toMonthKey(d)
}

export default function ExpenseView({ expenses }: { expenses: Expense[] }) {
  const currentMonthKey = useMemo(() => toMonthKey(new Date()), [])
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.spent_at.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  )

  const total = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses],
  )

  const byCategory = useMemo(() => {
    const map: Record<ExpenseCategory, number> = {
      groceries: 0,
      dining: 0,
      delivery: 0,
      snack: 0,
      alcohol: 0,
    }
    for (const e of monthExpenses) map[e.category] += e.amount
    return map
  }, [monthExpenses])

  const isCurrentMonth = selectedMonth === currentMonthKey

  return (
    <>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
          aria-label="이전 달"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ◀
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs text-zinc-500">
            {isCurrentMonth ? '이번 달 식비' : monthLabel(selectedMonth)}
          </span>
          <span className="text-2xl font-bold tabular-nums">
            ₩ {total.toLocaleString('ko-KR')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
          disabled={isCurrentMonth}
          aria-label="다음 달"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
        >
          ▶
        </button>
      </div>

      {total > 0 && (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          {EXPENSE_CATEGORIES.map((cat) => {
            const amount = byCategory[cat]
            const percent = total > 0 ? (amount / total) * 100 : 0
            return (
              <div key={cat} className="flex items-center gap-2 text-sm">
                <span className="flex w-24 flex-shrink-0 items-center">
                  <span className="inline-flex w-6 justify-center">
                    {EXPENSE_CATEGORY_EMOJIS[cat]}
                  </span>
                  <span className="truncate text-xs">
                    {EXPENSE_CATEGORY_LABELS[cat]}
                  </span>
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={barColor(cat)}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-zinc-500">
                  {percent.toFixed(0)}%
                </span>
                <span className="w-20 text-right text-xs tabular-nums">
                  ₩ {amount.toLocaleString('ko-KR')}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <ExpenseList items={monthExpenses} />

      <AddExpenseButton />
    </>
  )
}

function barColor(cat: ExpenseCategory): string {
  const base =
    'absolute inset-y-0 left-0 rounded-full transition-[width] duration-300'
  switch (cat) {
    case 'groceries':
      return `${base} bg-emerald-500`
    case 'dining':
      return `${base} bg-amber-500`
    case 'delivery':
      return `${base} bg-sky-500`
    case 'snack':
      return `${base} bg-rose-400`
    case 'alcohol':
      return `${base} bg-violet-500`
  }
}
