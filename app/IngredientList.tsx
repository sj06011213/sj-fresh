'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  CATEGORY_LABELS,
  type Category,
  type Ingredient,
  type Usage,
} from '@/lib/supabase'
import { consumeIngredient, updateIngredient } from './actions'
import AddIngredientButton from './AddIngredientButton'
import RecordUsageButton from './RecordUsageButton'

type DateType = 'expiry' | 'opened'
type SortMode = 'expiry' | 'oldest'

const CATEGORIES: Category[] = ['fridge', 'freezer', 'pantry']

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
  usages,
}: {
  ingredients: Ingredient[]
  usages: Usage[]
}) {
  const [selected, setSelected] = useState<Category>('fridge')
  const [sortMode, setSortMode] = useState<SortMode>('expiry')
  const [editing, setEditing] = useState<Ingredient | null>(null)

  const counts = useMemo(() => {
    const c: Record<Category, number> = { fridge: 0, freezer: 0, pantry: 0 }
    for (const ing of ingredients) {
      c[ing.category] = (c[ing.category] ?? 0) + 1
    }
    return c
  }, [ingredients])

  const usageCountByIngredient = useMemo(() => {
    const c: Record<string, number> = {}
    for (const u of usages) {
      c[u.ingredient_id] = (c[u.ingredient_id] ?? 0) + 1
    }
    return c
  }, [usages])

  const filtered = useMemo(() => {
    const arr = ingredients.filter((ing) => ing.category === selected)
    if (sortMode === 'oldest') {
      arr.sort((a, b) => a.added_at.localeCompare(b.added_at))
    } else {
      arr.sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0
        if (!a.expiry_date) return 1
        if (!b.expiry_date) return -1
        return a.expiry_date.localeCompare(b.expiry_date)
      })
    }
    return arr
  }, [ingredients, selected, sortMode])

  return (
    <>
      <div className="mb-2 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelected(cat)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              selected === cat
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-500'
            }`}
          >
            {CATEGORY_LABELS[cat]}{' '}
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                selected === cat
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                  : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
              }`}
            >
              {counts[cat]}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex justify-end gap-1 text-xs">
        {(
          [
            { value: 'expiry', label: '⏰ 임박순' },
            { value: 'oldest', label: '📅 오래된순' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSortMode(opt.value)}
            className={`rounded-full px-3 py-1 font-medium transition ${
              sortMode === opt.value
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <ul className="flex flex-col gap-2">
          <li className="py-12 text-center text-zinc-400">
            {CATEGORY_LABELS[selected]} 재료가 아직 없어요.
            <br />
            오른쪽 아래 + 버튼으로 추가해보세요!
          </li>
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((ing) => {
            const d = daysUntil(ing.expiry_date)
            const badge =
              d === null
                ? ''
                : d < 0
                ? `D+${-d}`
                : d === 0
                ? 'D-day'
                : `D-${d}`
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
                  {usageCountByIngredient[ing.id] > 0 && (
                    <span className="mt-1 text-xs text-zinc-400">
                      📊 {usageCountByIngredient[ing.id]}회 사용
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
                    className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                  >
                    소비
                  </button>
                </form>
              </li>
            )
          })}
        </ul>
      )}

      <AddIngredientButton defaultCategory={selected} />
      <RecordUsageButton ingredients={ingredients} />

      {editing && (
        <EditDialog ingredient={editing} onClose={() => setEditing(null)} />
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

  const [category, setCategory] = useState<Category>(ingredient.category)
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
            {CATEGORIES.map((cat) => (
              <label
                key={cat}
                className={`flex-1 cursor-pointer rounded-md py-2 text-center text-sm font-medium transition ${
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
                {CATEGORY_LABELS[cat]}
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
