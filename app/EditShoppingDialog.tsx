'use client'

import { useRef, useState, useTransition } from 'react'
import type { ShoppingItem } from '@/lib/supabase'
import { deleteShoppingItem, updateShoppingItem } from './actions/shopping'
import AutoResizeTextarea from './AutoResizeTextarea'
import Modal from './Modal'

export default function EditShoppingDialog({
  item,
  onClose,
}: {
  item: ShoppingItem
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await updateShoppingItem(formData)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  function handleDelete() {
    setError(null)
    const fd = new FormData()
    fd.append('id', item.id)
    startDeleteTransition(async () => {
      try {
        await deleteShoppingItem(fd)
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      }
    })
  }

  return (
    <Modal title="🛒 장볼 항목 수정" onClose={onClose}>
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
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
        <AutoResizeTextarea
          name="memo"
          placeholder="메모 (선택)"
          rows={2}
          defaultValue={item.memo ?? ''}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-black"
        />

        {error && (
          <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            ⚠️ {error}
          </p>
        )}

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
    </Modal>
  )
}
