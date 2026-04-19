'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import type { Ingredient } from '@/lib/supabase'
import { consumeIngredient, updateIngredient } from './actions'

type DateType = 'expiry' | 'opened'

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((target.getTime() - today.getTime()) / 86_400_000)
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const past = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - past.getTime()) / 86_400_000)
}

export default function IngredientList({
  ingredients,
}: {
  ingredients: Ingredient[]
}) {
  const [editing, setEditing] = useState<Ingredient | null>(null)

  if (ingredients.length === 0) {
    return (
      <ul className="flex flex-col gap-2">
        <li className="py-12 text-center text-zinc-400">
          아직 재료가 없어요.
          <br />
          오른쪽 아래 + 버튼으로 추가해보세요!
        </li>
      </ul>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {ingredients.map((ing) => {
          const d = daysUntil(ing.expiry_date)
          const badge =
            d === null ? '' : d < 0 ? `D+${-d}` : d === 0 ? 'D-day' : `D-${d}`
          const urgent = d !== null && d <= 3
          const opened = daysSince(ing.opened_at)
          return (
            <li
              key={ing.id}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                urgent
                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-950'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setEditing(ing)}
                className="flex flex-1 flex-col items-start text-left"
              >
                <span className="font-medium">
                  {ing.name}
                  {ing.quantity && (
                    <span className="ml-2 text-sm font-normal text-zinc-500">
                      · {ing.quantity}
                    </span>
                  )}
                </span>
                {ing.expiry_date && (
                  <span
                    className={`text-sm ${
                      urgent
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-zinc-500'
                    }`}
                  >
                    🗓️ {ing.expiry_date} · {badge}
                  </span>
                )}
                {ing.opened_at && !ing.expiry_date && (
                  <span className="text-sm text-zinc-500">
                    📦 {ing.opened_at} 개봉 ·{' '}
                    {opened === null
                      ? ''
                      : opened === 0
                      ? '오늘'
                      : `${opened}일차`}
                  </span>
                )}
                {ing.memo && (
                  <span className="mt-1 line-clamp-1 text-xs text-zinc-400">
                    📝 {ing.memo}
                  </span>
                )}
              </button>
              <form action={consumeIngredient} className="ml-2">
                <input type="hidden" name="id" value={ing.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
                >
                  소비
                </button>
              </form>
            </li>
          )
        })}
      </ul>

      {editing && (
        <EditDialog
          ingredient={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function EditDialog({
  ingredient,
  onClose,
}: {
  ingredient: Ingredient
  onClose: () => void
}) {
  const initialDateType: DateType = ingredient.opened_at ? 'opened' : 'expiry'
  const initialDate = ingredient.opened_at ?? ingredient.expiry_date ?? ''

  const [dateType, setDateType] = useState<DateType>(initialDateType)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateIngredient(formData)
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
          <h2 className="text-lg font-semibold">재료 수정</h2>
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
          <input type="hidden" name="id" value={ingredient.id} />

          <input
            name="name"
            placeholder="재료 이름"
            required
            defaultValue={ingredient.name}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
          />
          <input
            name="quantity"
            placeholder="양"
            defaultValue={ingredient.quantity ?? ''}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
          />

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
              defaultValue={initialDate}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
            />
          </label>

          <textarea
            name="memo"
            placeholder="메모 (선택)"
            rows={3}
            defaultValue={ingredient.memo ?? ''}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-black"
          />

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-lg bg-emerald-600 py-3 text-base font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </div>
  )
}
