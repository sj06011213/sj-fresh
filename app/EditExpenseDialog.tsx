'use client'

import { useRef, useState, useTransition } from 'react'
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_EMOJIS,
  EXPENSE_CATEGORY_LABELS,
  type Expense,
  type ExpenseCategory,
} from '@/lib/supabase'
import { deleteExpense, updateExpense } from './actions/expenses'
import AutoResizeTextarea from './AutoResizeTextarea'
import Modal from './Modal'
import PlaceInput from './PlaceInput'

export default function EditExpenseDialog({
  expense,
  onClose,
}: {
  expense: Expense
  onClose: () => void
}) {
  const [category, setCategory] = useState<ExpenseCategory>(expense.category)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await updateExpense(formData)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  function handleDelete() {
    setError(null)
    const fd = new FormData()
    fd.append('id', expense.id)
    startDeleteTransition(async () => {
      try {
        await deleteExpense(fd)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  return (
    <Modal title="💰 지출 수정" onClose={onClose}>
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
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
              <span className="text-lg">{EXPENSE_CATEGORY_EMOJIS[cat]}</span>
              <span className="truncate">{EXPENSE_CATEGORY_LABELS[cat]}</span>
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

        <AutoResizeTextarea
          name="memo"
          placeholder="메모 (선택)"
          rows={2}
          defaultValue={expense.memo ?? ''}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-black"
        />

        {error && (
          <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            ⚠️ {error}
          </p>
        )}

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
    </Modal>
  )
}
