'use client'

import { useRef, useState, useTransition } from 'react'
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_EMOJIS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from '@/lib/supabase'
import { today } from '@/lib/utils/date'
import { addExpense } from './actions/expenses'
import Modal from './Modal'
import PlaceInput from './PlaceInput'

export default function AddExpenseButton() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<ExpenseCategory>('groceries')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await addExpense(formData)
        formRef.current?.reset()
        setCategory('groceries')
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  function openModal() {
    setCategory('groceries')
    setError(null)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="지출 기록"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-3xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
      >
        +
      </button>

      {open && (
        <Modal title="💰 지출 기록" onClose={() => setOpen(false)}>
          <form
            ref={formRef}
            action={handleSubmit}
            className="flex flex-col gap-3"
          >
            <input
              name="description"
              placeholder="어디서/뭘 샀나요? (예: 스타벅스 아메리카노)"
              required
              autoFocus
              maxLength={80}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
            />

            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-black">
              <span className="text-base text-zinc-500">₩</span>
              <input
                name="amount"
                type="number"
                inputMode="numeric"
                placeholder="금액 (예: 5900)"
                required
                min="0"
                step="1"
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
                  <span className="text-lg">{EXPENSE_CATEGORY_EMOJIS[cat]}</span>
                  <span className="truncate">{EXPENSE_CATEGORY_LABELS[cat]}</span>
                </label>
              ))}
            </div>

            {category === 'groceries' && <PlaceInput name="place" />}

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
                defaultValue={today()}
                required
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              />
            </label>

            <textarea
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
              {isPending ? '기록 중...' : '기록'}
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
