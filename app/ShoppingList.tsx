'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ShoppingItem } from '@/lib/supabase'
import { parseShoppingText } from '@/lib/utils/voice-parser'
import {
  addShoppingItem,
  deleteShoppingItem,
  restoreShoppingItem,
  setShoppingItemBought,
} from './actions/shopping'
import EditShoppingDialog from './EditShoppingDialog'
import UndoToast from './UndoToast'
import VoiceInputButton from './VoiceInputButton'

const UNDO_DURATION_MS = 5000
const VOICE_HINT_DURATION_MS = 2500
const TOGGLE_SYNC_DEBOUNCE_MS = 250

export default function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<ShoppingItem | null>(null)
  const [undoItem, setUndoItem] = useState<ShoppingItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const voiceHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Optimistic overlay: ids we've toggled client-side but haven't seen
  // reflected in props yet. Cleared when server-fresh props arrive.
  const [pendingToggle, setPendingToggle] = useState<Map<string, boolean>>(
    () => new Map(),
  )
  const toggleTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  // Clear optimistic entries once the incoming props match the expected state.
  // Render-phase state sync per React docs ("Adjusting state on prop change").
  const [prevItems, setPrevItems] = useState(items)
  if (prevItems !== items) {
    setPrevItems(items)
    if (pendingToggle.size > 0) {
      const next = new Map(pendingToggle)
      for (const item of items) {
        const expected = next.get(item.id)
        if (expected === undefined) continue
        if (!!item.bought_at === expected) next.delete(item.id)
      }
      if (next.size !== pendingToggle.size) setPendingToggle(next)
    }
  }

  useEffect(() => {
    const toggleTimers = toggleTimersRef.current
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      if (voiceHintTimerRef.current) clearTimeout(voiceHintTimerRef.current)
      for (const t of toggleTimers.values()) clearTimeout(t)
      toggleTimers.clear()
    }
  }, [])

  function handleVoiceTranscript(text: string) {
    const { name, quantity } = parseShoppingText(text)
    if (!name) return
    const fd = new FormData()
    fd.append('name', name)
    if (quantity) fd.append('quantity', quantity)
    setError(null)
    startTransition(async () => {
      try {
        await addShoppingItem(fd)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
        return
      }
    })
    const label = quantity ? `${name} · ${quantity}` : name
    setVoiceHint(label)
    if (voiceHintTimerRef.current) clearTimeout(voiceHintTimerRef.current)
    voiceHintTimerRef.current = setTimeout(() => {
      setVoiceHint(null)
      voiceHintTimerRef.current = null
    }, VOICE_HINT_DURATION_MS)
  }

  function handleToggle(item: ShoppingItem) {
    // 1. Read current displayed state (optimistic overlay wins)
    const currentDisplay =
      pendingToggle.get(item.id) ?? !!item.bought_at
    const target = !currentDisplay

    // 2. Flip optimistic state immediately — synchronous, no await
    setPendingToggle((prev) => {
      const next = new Map(prev)
      next.set(item.id, target)
      return next
    })

    // 3. Debounce server sync per-item: rapid clicks coalesce into one call
    const existingTimer = toggleTimersRef.current.get(item.id)
    if (existingTimer) clearTimeout(existingTimer)

    const timer = setTimeout(() => {
      toggleTimersRef.current.delete(item.id)
      const fd = new FormData()
      fd.append('id', item.id)
      fd.append('bought', target ? 'true' : 'false')

      // Fire-and-forget — don't block the UI thread
      setShoppingItemBought(fd)
        .then(() => {
          router.refresh()
        })
        .catch((e: unknown) => {
          // Only revert if user hasn't clicked again since
          setPendingToggle((prev) => {
            if (prev.get(item.id) !== target) return prev
            const next = new Map(prev)
            next.delete(item.id)
            return next
          })
          setError(e instanceof Error ? e.message : '알 수 없는 오류')
        })
    }, TOGGLE_SYNC_DEBOUNCE_MS)

    toggleTimersRef.current.set(item.id, timer)
  }

  function handleDelete(item: ShoppingItem) {
    setError(null)
    const fd = new FormData()
    fd.append('id', item.id)
    startTransition(async () => {
      try {
        await deleteShoppingItem(fd)
        setUndoItem(item)
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        undoTimerRef.current = setTimeout(() => {
          setUndoItem(null)
          undoTimerRef.current = null
        }, UNDO_DURATION_MS)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  function handleUndo() {
    if (!undoItem) return
    setError(null)
    const fd = new FormData()
    fd.append('id', undoItem.id)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    startTransition(async () => {
      try {
        await restoreShoppingItem(fd)
        setUndoItem(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  // Project items through the optimistic overlay so the UI reflects the
  // toggled state instantly even before revalidated props arrive.
  const projected = useMemo(
    () =>
      items.map((item) => {
        const pending = pendingToggle.get(item.id)
        if (pending === undefined) return item
        return {
          ...item,
          bought_at: pending
            ? (item.bought_at ?? new Date().toISOString())
            : null,
        }
      }),
    [items, pendingToggle],
  )

  const sorted = useMemo(() => {
    const copy = [...projected]
    copy.sort((a, b) => {
      if (!a.bought_at && !b.bought_at)
        return b.created_at.localeCompare(a.created_at)
      if (!a.bought_at) return -1
      if (!b.bought_at) return 1
      return (b.bought_at ?? '').localeCompare(a.bought_at ?? '')
    })
    return copy
  }, [projected])

  function handleAdd(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await addShoppingItem(formData)
        formRef.current?.reset()
        formRef.current
          ?.querySelector<HTMLInputElement>('input[name="name"]')
          ?.focus()
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  return (
    <>
      <form ref={formRef} action={handleAdd} className="flex gap-2">
        <input
          name="name"
          placeholder="뭘 사야 하나요? (예: 우유)"
          required
          maxLength={80}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
        />
        <VoiceInputButton
          disabled={isPending}
          onTranscript={handleVoiceTranscript}
        />
        <button
          type="submit"
          disabled={isPending}
          aria-label="추가"
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-2xl text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          +
        </button>
      </form>

      <div className="mb-4 mt-1 min-h-[1.25rem] text-xs text-emerald-600 dark:text-emerald-400">
        {voiceHint && <span>🎤 방금 추가: {voiceHint}</span>}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          ⚠️ {error}
        </p>
      )}

      {sorted.length === 0 ? (
        <ul className="flex flex-col gap-2">
          <li className="py-12 text-center text-zinc-400">
            장볼 게 없어요.
            <br />
            위에 입력해서 하나씩 추가해보세요!
          </li>
        </ul>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((item) => {
            const bought = !!item.bought_at
            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  bought
                    ? 'border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  aria-label={bought ? '장본 것 되돌리기' : '장봤음 체크'}
                  className={`flex h-7 w-7 items-center justify-center rounded-md border-2 text-sm transition ${
                    bought
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-zinc-300 hover:border-emerald-400 dark:border-zinc-600'
                  }`}
                >
                  {bought && '✓'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className={`flex flex-1 flex-col items-start text-left ${
                    bought ? 'text-zinc-400 line-through' : ''
                  }`}
                >
                  <span className="font-medium">
                    {item.name}
                    {item.quantity && (
                      <span className="ml-2 text-sm font-normal text-zinc-500">
                        · {item.quantity}
                      </span>
                    )}
                  </span>
                  {item.memo && (
                    <span className="mt-1 line-clamp-1 text-xs text-zinc-400">
                      📝 {item.memo}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={isPending}
                  aria-label={`${item.name} 삭제`}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <EditShoppingDialog item={editing} onClose={() => setEditing(null)} />
      )}

      {undoItem && (
        <UndoToast
          key={undoItem.id}
          label={`"${undoItem.name}" 삭제됨`}
          onUndo={handleUndo}
          durationMs={UNDO_DURATION_MS}
        />
      )}
    </>
  )
}
