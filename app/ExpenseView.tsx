'use client'

import { useMemo, useState } from 'react'
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_EMOJIS,
  EXPENSE_CATEGORY_LABELS,
  type Expense,
  type ExpenseCategory,
} from '@/lib/supabase'
import { formatKRW } from '@/lib/utils/currency'
import {
  currentMonthKey,
  monthLabel,
  shiftMonth,
} from '@/lib/utils/month'
import AddExpenseButton from './AddExpenseButton'
import ExpenseList from './ExpenseList'

export default function ExpenseView({ expenses }: { expenses: Expense[] }) {
  const nowKey = useMemo(() => currentMonthKey(), [])
  const [selectedMonth, setSelectedMonth] = useState(nowKey)
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory | null>(null)

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.spent_at.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  )

  const visibleExpenses = useMemo(
    () =>
      selectedCategory
        ? monthExpenses.filter((e) => e.category === selectedCategory)
        : monthExpenses,
    [monthExpenses, selectedCategory],
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

  const isCurrentMonth = selectedMonth === nowKey

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
          <span className="text-2xl font-medium tabular-nums">
            {formatKRW(total)}
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
        <div className="mb-4 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
          {EXPENSE_CATEGORIES.map((cat) => {
            const amount = byCategory[cat]
            const percent = total > 0 ? (amount / total) * 100 : 0
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setSelectedCategory(isSelected ? null : cat)
                }
                aria-pressed={isSelected}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
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
                  {formatKRW(amount)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {selectedCategory && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800">
          <span>
            {EXPENSE_CATEGORY_EMOJIS[selectedCategory]}{' '}
            <span className="font-medium">
              {EXPENSE_CATEGORY_LABELS[selectedCategory]}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="rounded px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            ✕ 전체보기
          </button>
        </div>
      )}

      <ExpenseList items={visibleExpenses} />

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
