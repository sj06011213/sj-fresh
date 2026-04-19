'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { ShoppingItem } from '@/lib/supabase'
import { addShoppingItem, toggleShoppingItem } from './actions'

export default function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const sorted = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => {
      if (!a.bought_at && !b.bought_at)
        return b.created_at.localeCompare(a.created_at)
      if (!a.bought_at) return -1
      if (!b.bought_at) return 1
      return (b.bought_at ?? '').localeCompare(a.bought_at ?? '')
    })
    return copy
  }, [items])

  return (
    <>
      {sorted.length === 0 ? (
        <ul className="flex flex-col gap-2">
          <li className="py-12 text-center text-zinc-400">
            장볼 게 없어요.
            <br />
            오른쪽 아래 + 버튼으로 추가해보세요!
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
                <form action={toggleShoppingItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    type="hidden"
                    name="currently_bought"
                    value={bought ? 'true' : 'false'}
                  />
                  <button
                    type="submit"
                    aria-label={bought ? '장본 것 되돌리기' : '장봤음 체크'}
                    className={`flex h-7 w-7 items-center justify-center rounded-md border-2 text-sm transition ${
                      bought
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-zinc-300 hover:border-emerald-400 dark:border-zinc-600'
                    }`}
                  >
                    {bought && '✓'}
                  </button>
                </form>

                <div
                  className={`flex flex-1 flex-col ${
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
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AddShoppingItemButton />
    </>
  )
}

function AddShoppingItemButton() {
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

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addShoppingItem(formData)
      formRef.current?.reset()
      setOpen(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="장볼 항목 추가"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-3xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95"
      >
        +
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
              <h2 className="text-lg font-semibold">🛒 장볼 항목 추가</h2>
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
              <input
                name="name"
                placeholder="뭘 사야 하나요? (예: 우유)"
                required
                autoFocus
                className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              />
              <input
                name="quantity"
                placeholder="양 (예: 500ml, 2개)"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
              />
              <textarea
                name="memo"
                placeholder="메모 (선택) — 예: 저지방으로"
                rows={2}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-black"
              />
              <button
                type="submit"
                disabled={isPending}
                className="mt-2 rounded-lg bg-emerald-600 py-3 text-base font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isPending ? '추가 중...' : '추가'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
