'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { CATEGORY_LABELS, type Ingredient } from '@/lib/supabase'
import { recordUsage } from './actions'

export default function RecordUsageButton({
  ingredients,
}: {
  ingredients: Ingredient[]
}) {
  const [open, setOpen] = useState(false)
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

  if (ingredients.length === 0) return null

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await recordUsage(formData)
      formRef.current?.reset()
      setOpen(false)
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="소진 기록"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-lime-200 text-2xl shadow-lg transition-transform hover:scale-105 hover:bg-lime-300 active:scale-95"
      >
        🍴
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">소진 기록</h2>
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
              <label className="flex flex-col gap-1 text-sm text-zinc-500">
                재료
                <select
                  name="ingredient_id"
                  required
                  defaultValue=""
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
                >
                  <option value="" disabled>
                    재료를 선택하세요
                  </option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                      {ing.quantity ? ` · ${ing.quantity}` : ''} (
                      {CATEGORY_LABELS[ing.category]})
                    </option>
                  ))}
                </select>
              </label>

              <input
                name="amount"
                placeholder="사용한 양 (예: 200ml, 한 컵, 2개)"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              />

              <label className="flex items-center gap-2 text-sm text-zinc-500">
                사용 날짜
                <input
                  name="used_at"
                  type="date"
                  defaultValue={today}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
                />
              </label>

              <textarea
                name="memo"
                placeholder="메모 (선택) — 예: 김치볶음밥 만들 때"
                rows={2}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-black"
              />

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 rounded-lg bg-zinc-900 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {isPending ? '기록 중...' : '기록'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
