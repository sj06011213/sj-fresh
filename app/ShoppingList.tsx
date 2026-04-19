'use client'

import { useMemo, useRef, useTransition } from 'react'
import type { ShoppingItem } from '@/lib/supabase'
import { addShoppingItem, toggleShoppingItem } from './actions'

export default function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

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

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addShoppingItem(formData)
      formRef.current?.reset()
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="name"]')
        ?.focus()
    })
  }

  return (
    <>
      <form
        ref={formRef}
        action={handleAdd}
        className="mb-4 flex gap-2"
      >
        <input
          name="name"
          placeholder="뭘 사야 하나요? (예: 우유)"
          required
          maxLength={80}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
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
    </>
  )
}
