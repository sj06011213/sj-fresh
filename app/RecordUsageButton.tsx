'use client'

import { useRef, useState, useTransition } from 'react'
import { CATEGORY_LABELS, type Ingredient } from '@/lib/supabase'
import { today } from '@/lib/utils/date'
import { recordUsage } from './actions/ingredients'
import Modal from './Modal'

export default function RecordUsageButton({
  ingredients,
}: {
  ingredients: Ingredient[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (ingredients.length === 0) return null

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await recordUsage(formData)
        formRef.current?.reset()
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  function openModal() {
    setError(null)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="소진 기록"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl shadow-lg transition-transform hover:scale-105 hover:bg-zinc-200 active:scale-95 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      >
        🍴
      </button>

      {open && (
        <Modal title="소진 기록" onClose={() => setOpen(false)}>
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

            <div className="flex flex-col gap-1">
              <input
                name="amount"
                placeholder="사용한 양 (예: 200ml, 한 컵, 2개)"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              />
              <span className="px-1 text-xs text-zinc-400">
                💡 재료 단위랑 맞게 쓰면 (예: 200ml) 남은 양이 자동 계산돼요
              </span>
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
              사용 날짜
              <input
                name="used_at"
                type="date"
                defaultValue={today()}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              />
            </label>

            <textarea
              name="memo"
              placeholder="메모 (선택) — 예: 김치볶음밥 만들 때"
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
              className="mt-2 rounded-lg bg-zinc-900 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {isPending ? '기록 중...' : '기록'}
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
