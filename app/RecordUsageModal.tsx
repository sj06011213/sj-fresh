'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_LABELS, type Ingredient } from '@/lib/supabase'
import { today } from '@/lib/utils/date'
import { parseQuantity } from '@/lib/utils/quantity'
import { recordUsage } from './actions/ingredients'
import AutoResizeTextarea from './AutoResizeTextarea'
import Modal from './Modal'

export default function RecordUsageModal({
  open,
  onClose,
  ingredients,
  defaultIngredientId,
}: {
  open: boolean
  onClose: () => void
  ingredients: Ingredient[]
  defaultIngredientId?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedId, setSelectedId] = useState<string>('')
  const [usedNum, setUsedNum] = useState<string>('')

  useEffect(() => {
    if (open) {
      setError(null)
      setSelectedId(defaultIngredientId ?? '')
      setUsedNum('')
    }
  }, [open, defaultIngredientId])

  const selectedIngredient = useMemo(
    () => ingredients.find((i) => i.id === selectedId) ?? null,
    [ingredients, selectedId],
  )
  const currentParsed = selectedIngredient
    ? parseQuantity(selectedIngredient.quantity)
    : null
  const unit = currentParsed?.unit ?? null
  const amountValue = unit && usedNum ? `${usedNum}${unit}` : usedNum

  if (!open) return null

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await recordUsage(formData)
        router.refresh()
        formRef.current?.reset()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  return (
    <Modal title="소진 기록" onClose={onClose}>
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
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value)
              setUsedNum('')
            }}
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
          <span className="px-1 text-xs text-zinc-500">
            사용한 양
            {selectedIngredient?.quantity && (
              <span className="ml-2 text-zinc-400">
                · 남은 양 {selectedIngredient.quantity}
              </span>
            )}
          </span>
          {unit ? (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-black">
              <input
                type="number"
                inputMode="decimal"
                value={usedNum}
                onChange={(e) => setUsedNum(e.target.value)}
                placeholder="숫자만 입력 (예: 200)"
                min="0"
                step="any"
                className="flex-1 bg-transparent py-3 text-base outline-none"
              />
              <span className="text-sm text-zinc-500">{unit}</span>
            </div>
          ) : (
            <input
              type="text"
              value={usedNum}
              onChange={(e) => setUsedNum(e.target.value)}
              placeholder="양 (예: 한 팩) — 선택"
              maxLength={40}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
            />
          )}
          <input type="hidden" name="amount" value={amountValue} />
          {unit && (
            <span className="px-1 text-xs text-zinc-400">
              💡 남은 양에서 자동 차감, 다 쓰면 항목이 사라져요
            </span>
          )}
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

        <AutoResizeTextarea
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
          {isPending ? '기록 중...' : '소비'}
        </button>
      </form>
    </Modal>
  )
}
