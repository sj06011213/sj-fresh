'use client'

import { useRef, useState, useTransition } from 'react'
import type { Category } from '@/lib/supabase'
import { addIngredient } from './actions/ingredients'
import AutoResizeTextarea from './AutoResizeTextarea'
import Modal from './Modal'
import QuantityInput from './QuantityInput'

type DateType = 'expiry' | 'opened'

export default function AddIngredientButton({
  defaultCategory = 'fridge',
}: {
  defaultCategory?: Category
}) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category>(defaultCategory)
  const [dateType, setDateType] = useState<DateType>('expiry')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await addIngredient(formData)
        formRef.current?.reset()
        setDateType('expiry')
        setCategory(defaultCategory)
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  function openModal() {
    setCategory(defaultCategory)
    setDateType('expiry')
    setError(null)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="재료 추가"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-3xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
      >
        +
      </button>

      {open && (
        <Modal title="재료 추가" onClose={() => setOpen(false)}>
          <form
            ref={formRef}
            action={handleSubmit}
            className="flex flex-col gap-3"
          >
            <input
              name="name"
              placeholder="재료 이름 (예: 우유)"
              required
              autoFocus
              className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
            />
            <QuantityInput name="quantity" />

            <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              {(
                [
                  { value: 'fridge', label: '냉장' },
                  { value: 'freezer', label: '냉동' },
                  { value: 'pantry', label: '팬트리' },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 cursor-pointer rounded-md py-2 text-center text-sm font-medium transition ${
                    category === opt.value
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                      : 'text-zinc-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={opt.value}
                    checked={category === opt.value}
                    onChange={() => setCategory(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
              {(
                [
                  { value: 'expiry', label: '🗓️ 유통기한' },
                  { value: 'opened', label: '📦 개봉일자' },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 cursor-pointer rounded-md py-2 text-center text-sm font-medium transition ${
                    dateType === opt.value
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                      : 'text-zinc-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="date_type"
                    value={opt.value}
                    checked={dateType === opt.value}
                    onChange={() => setDateType(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

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
              {dateType === 'expiry' ? '유통기한' : '개봉일자'}
              <input
                name="date"
                type="date"
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              />
            </label>
            <AutoResizeTextarea
              name="memo"
              placeholder="메모 (선택) — 예: 엄마가 준 거, 반만 먹음"
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
              {isPending ? '추가 중...' : '추가'}
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
