'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import type { Category } from '@/lib/supabase'
import { addIngredient } from './actions'

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
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addIngredient(formData)
      formRef.current?.reset()
      setDateType('expiry')
      setCategory(defaultCategory)
      setOpen(false)
    })
  }

  function openModal() {
    setCategory(defaultCategory)
    setDateType('expiry')
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="재료 추가"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-3xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95"
      >
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">재료 추가</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
              <input
                name="name"
                placeholder="재료 이름 (예: 우유)"
                required
                autoFocus
                className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              />
              <input
                name="quantity"
                placeholder="양 (예: 500ml, 2개, 한 팩)"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              />

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

              <label className="flex items-center gap-2 text-sm text-zinc-500">
                {dateType === 'expiry' ? '유통기한' : '개봉일자'}
                <input
                  name="date"
                  type="date"
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
                />
              </label>
              <textarea
                name="memo"
                placeholder="메모 (선택) — 예: 엄마가 준 거, 반만 먹음"
                rows={2}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-black"
              />
              <button
                type="submit"
                disabled={isPending}
                className="mt-2 rounded-lg bg-emerald-600 py-3 text-base font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isPending ? '추가 중...' : '추가'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
