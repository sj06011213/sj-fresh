'use client'

import { useEffect, useState } from 'react'

export default function UndoToast({
  label,
  onUndo,
  durationMs,
}: {
  label: string
  onUndo: () => void
  durationMs: number
}) {
  const [remaining, setRemaining] = useState(durationMs)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const left = Math.max(0, durationMs - (Date.now() - start))
      setRemaining(left)
      if (left <= 0) clearInterval(interval)
    }, 100)
    return () => clearInterval(interval)
  }, [durationMs])

  const progress = (remaining / durationMs) * 100

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
    >
      <div className="overflow-hidden rounded-xl bg-zinc-900 text-white shadow-2xl dark:bg-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex-1 truncate text-sm">
            <span className="mr-1">🗑</span>
            {label}
          </span>
          <button
            type="button"
            onClick={onUndo}
            className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-emerald-300 hover:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            실행 취소
          </button>
        </div>
        <div
          className="h-1 bg-emerald-400 transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
