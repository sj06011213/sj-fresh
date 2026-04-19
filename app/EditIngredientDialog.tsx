'use client'

import { useRef, useState, useTransition } from 'react'
import {
  CATEGORY_LABELS,
  type Category,
  type Ingredient,
} from '@/lib/supabase'
import { updateIngredient } from './actions/ingredients'
import Modal from './Modal'
import QuantityInput from './QuantityInput'

type DateType = 'expiry' | 'opened'
const CATEGORIES: Category[] = ['fridge', 'freezer', 'pantry']

export default function EditIngredientDialog({
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
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await updateIngredient(formData)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  return (
    <Modal title="재료 수정" onClose={onClose}>
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={ingredient.id} />

        <input
          name="name"
          placeholder="재료 이름"
          required
          defaultValue={ingredient.name}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
        />
        <QuantityInput
          name="quantity"
          defaultValue={ingredient.quantity ?? ''}
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

        <a
          href={`https://chatgpt.com/?q=${encodeURIComponent(
            `냉장고에 ${ingredient.name}${
              ingredient.quantity ? ` ${ingredient.quantity}` : ''
            }가 있어. 이걸로 만들 수 있는 간단한 레시피 3가지 추천해줘.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-emerald-600 py-3 text-base font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          ✨ 이 재료로 레시피 추천받기 (ChatGPT)
        </a>

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
          {isPending ? '저장 중...' : '저장'}
        </button>
      </form>
    </Modal>
  )
}
