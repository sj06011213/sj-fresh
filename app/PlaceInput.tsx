'use client'

import { useState } from 'react'

const PRESETS = ['마트', '편의점', '시장'] as const
type Preset = (typeof PRESETS)[number]
type Selected = Preset | 'other' | null

function parseInitial(value: string): { selected: Selected; custom: string } {
  const trimmed = value.trim()
  if (!trimmed) return { selected: null, custom: '' }
  if ((PRESETS as readonly string[]).includes(trimmed)) {
    return { selected: trimmed as Preset, custom: '' }
  }
  return { selected: 'other', custom: trimmed }
}

export default function PlaceInput({
  name,
  defaultValue,
}: {
  name: string
  defaultValue?: string
}) {
  const [state] = useState(() => parseInitial(defaultValue ?? ''))
  const [selected, setSelected] = useState<Selected>(state.selected)
  const [custom, setCustom] = useState(state.custom)

  const combined =
    selected === 'other' ? custom.trim() : selected ? selected : ''

  const btnClass = (active: boolean) =>
    `rounded-md py-2 text-sm font-medium transition ${
      active
        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
        : 'text-zinc-500'
    }`

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setSelected((prev) => (prev === p ? null : p))}
            className={btnClass(selected === p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            setSelected((prev) => (prev === 'other' ? null : 'other'))
          }
          className={btnClass(selected === 'other')}
        >
          기타
        </button>
      </div>
      {selected === 'other' && (
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="구매처 직접 입력 (예: 홈플러스, 스타벅스)"
          maxLength={40}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
        />
      )}
      <input type="hidden" name={name} value={combined} />
    </div>
  )
}
