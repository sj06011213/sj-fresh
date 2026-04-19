'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { ShoppingItem } from '@/lib/supabase'
import {
  addShoppingItem,
  deleteShoppingItem,
  toggleShoppingItem,
  updateShoppingItem,
} from './actions'

export default function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<ShoppingItem | null>(null)

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
      <form ref={formRef} action={handleAdd} className="mb-4 flex gap-2">
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
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <EditShoppingItemDialog
          item={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function EditShoppingItemDialog({
  item,
  onClose,
}: {
  item: ShoppingItem
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateShoppingItem(formData)
      onClose()
    })
  }

  function handleDelete() {
    const fd = new FormData()
    fd.append('id', item.id)
    startDeleteTransition(async () => {
      await deleteShoppingItem(fd)
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
          <h2 className="text-lg font-semibold">🛒 장볼 항목 수정</h2>
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
          <input type="hidden" name="id" value={item.id} />

          <input
            name="name"
            placeholder="이름"
            required
            defaultValue={item.name}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
          />
          <input
            name="quantity"
            placeholder="양 (예: 500ml, 2개)"
            defaultValue={item.quantity ?? ''}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-black"
          />
          <textarea
            name="memo"
            placeholder="메모 (선택)"
            rows={2}
            defaultValue={item.memo ?? ''}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-black"
          />

          <button
            type="submit"
            disabled={isPending || isDeleting}
            className="mt-2 rounded-lg bg-emerald-600 py-3 text-base font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            className="rounded-lg bg-rose-50 py-3 text-base font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900"
          >
            {isDeleting ? '삭제 중...' : '🗑 삭제'}
          </button>
        </form>
      </div>
    </div>
  )
}
