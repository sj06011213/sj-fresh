'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

function assertOk(error: { message: string } | null, verb: string): void {
  if (error) throw new Error(`${verb} 실패: ${error.message}`)
}

export async function addShoppingItem(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const quantity = String(formData.get('quantity') ?? '').trim()
  const memo = String(formData.get('memo') ?? '').trim()
  if (!name) throw new Error('구매 항목 이름을 입력해주세요.')

  const { error } = await supabase.from('shopping_items').insert({
    name,
    quantity: quantity || null,
    memo: memo || null,
  })
  assertOk(error, '구매 항목 추가')

  revalidatePath('/')
}

export async function setShoppingItemBought(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const bought = formData.get('bought') === 'true'
  if (!id) return

  const { error } = await supabase
    .from('shopping_items')
    .update({
      bought_at: bought ? new Date().toISOString() : null,
    })
    .eq('id', id)
  assertOk(error, '구매 상태 변경')

  revalidatePath('/')
}

export async function updateShoppingItem(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const quantity = String(formData.get('quantity') ?? '').trim()
  const memo = String(formData.get('memo') ?? '').trim()
  if (!id || !name) throw new Error('구매 항목 이름을 입력해주세요.')

  const { error } = await supabase
    .from('shopping_items')
    .update({
      name,
      quantity: quantity || null,
      memo: memo || null,
    })
    .eq('id', id)
  assertOk(error, '구매 항목 수정')

  revalidatePath('/')
}

export async function deleteShoppingItem(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const { error } = await supabase
    .from('shopping_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  assertOk(error, '구매 항목 삭제')

  revalidatePath('/')
}

export async function restoreShoppingItem(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const { error } = await supabase
    .from('shopping_items')
    .update({ deleted_at: null })
    .eq('id', id)
  assertOk(error, '구매 항목 복구')

  revalidatePath('/')
}
