'use client'

import { useState } from 'react'

type Unit = '' | '개' | 'g' | 'kg' | 'ml' | 'L' | 'other'

const UNIT_BUTTONS: { value: Exclude<Unit, ''>; label: string }[] = [
  { value: '개', label: '개' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'L', label: 'L' },
  { value: 'other', label: '기타' },
]

const KNOWN_UNIT_REGEX = /^(\d+(?:\.\d+)?)\s*(개|kg|L|ml|g)$/i
const NUMBER_ONLY_REGEX = /^(\d+(?:\.\d+)?)$/

function normalizeUnit(raw: string): Exclude<Unit, '' | 'other'> | null {
  const lower = raw.toLowerCase()
  if (lower === 'kg') return 'kg'
  if (lower === 'l') return 'L'
  if (lower === 'ml') return 'ml'
  if (lower === 'g') return 'g'
  if (raw === '개') return '개'
  return null
}

function parseInitial(value: string): {
  num: string
  unit: Unit
  other: string
} {
  const trimmed = value.trim()
  if (!trimmed) return { num: '', unit: '', other: '' }
  const m = trimmed.match(KNOWN_UNIT_REGEX)
  if (m) {
    const unit = normalizeUnit(m[2])
    if (unit) return { num: m[1], unit, other: '' }
  }
  if (NUMBER_ONLY_REGEX.test(trimmed)) {
    return { num: trimmed, unit: '', other: '' }
  }
  return { num: '', unit: 'other', other: trimmed }
}

export default function QuantityInput({
  name,
  defaultValue,
}: {
  name: string
  defaultValue?: string
}) {
  const [state] = useState(() => parseInitial(defaultValue ?? ''))
  const [num, setNum] = useState(state.num)
  const [unit, setUnit] = useState<Unit>(state.unit)
  const [other, setOther] = useState(state.other)

  const combined =
    unit === 'other'
      ? other.trim()
      : num && unit
        ? `${num}${unit}`
        : num

  return (
    <div className="flex flex-col gap-2">
      {unit === 'other' ? (
        <input
          type="text"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          placeholder="양 (예: 한 팩, 두 봉지)"
          maxLength={40}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
        />
      ) : (
        <input
          type="number"
          inputMode="decimal"
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder="양 (예: 500)"
          min="0"
          step="any"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
        />
      )}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {UNIT_BUTTONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              setUnit((prev) => (prev === opt.value ? '' : opt.value))
            }
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              unit === opt.value
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={combined} />
    </div>
  )
}
