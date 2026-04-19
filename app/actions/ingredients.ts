'use server'

import { revalidatePath } from 'next/cache'
import { supabase, type Category } from '@/lib/supabase'
import { formatQuantity, parseQuantity } from '@/lib/utils/quantity'

const VALID_CATEGORIES: Category[] = ['fridge', 'freezer', 'pantry']

function parseCategory(raw: string): Category {
  return (VALID_CATEGORIES as string[]).includes(raw)
    ? (raw as Category)
    : 'fridge'
}

function assertOk(error: { message: string } | null, verb: string): void {
  if (error) throw new Error(`${verb} 실패: ${error.message}`)
}

export async function addIngredient(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const quantity = String(formData.get('quantity') ?? '').trim()
  const category = parseCategory(String(formData.get('category') ?? ''))
  const dateType = String(formData.get('date_type') ?? 'expiry')
  const date = String(formData.get('date') ?? '')
  const memo = String(formData.get('memo') ?? '').trim()
  if (!name) throw new Error('재료 이름을 입력해주세요.')

  const { error } = await supabase.from('ingredients').insert({
    name,
    quantity: quantity || null,
    category,
    expiry_date: dateType === 'expiry' && date ? date : null,
    opened_at: dateType === 'opened' && date ? date : null,
    memo: memo || null,
  })
  assertOk(error, '재료 추가')

  revalidatePath('/')
}

export async function updateIngredient(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const quantity = String(formData.get('quantity') ?? '').trim()
  const category = parseCategory(String(formData.get('category') ?? ''))
  const dateType = String(formData.get('date_type') ?? 'expiry')
  const date = String(formData.get('date') ?? '')
  const memo = String(formData.get('memo') ?? '').trim()
  if (!id || !name) throw new Error('재료 이름을 입력해주세요.')

  const { error } = await supabase
    .from('ingredients')
    .update({
      name,
      quantity: quantity || null,
      category,
      expiry_date: dateType === 'expiry' && date ? date : null,
      opened_at: dateType === 'opened' && date ? date : null,
      memo: memo || null,
    })
    .eq('id', id)
  assertOk(error, '재료 수정')

  revalidatePath('/')
}

export async function consumeIngredient(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const { error } = await supabase
    .from('ingredients')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', id)
  assertOk(error, '재료 소진 처리')

  revalidatePath('/')
}

export async function reorderIngredients(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('ingredients').update({ sort_order: index }).eq('id', id),
    ),
  )
  revalidatePath('/')
}

export async function recordUsage(formData: FormData) {
  const ingredient_id = String(formData.get('ingredient_id') ?? '')
  const amount = String(formData.get('amount') ?? '').trim()
  const used_at =
    String(formData.get('used_at') ?? '') || new Date().toISOString().slice(0, 10)
  const memo = String(formData.get('memo') ?? '').trim()

  if (!ingredient_id) throw new Error('재료를 선택해주세요.')

  const { error: usageErr } = await supabase.from('usages').insert({
    ingredient_id,
    amount: amount || null,
    used_at,
    memo: memo || null,
  })
  assertOk(usageErr, '소진 기록')

  if (amount) {
    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('quantity')
      .eq('id', ingredient_id)
      .single()

    const current = parseQuantity(ingredient?.quantity)
    const used = parseQuantity(amount)

    if (current && used && current.unit === used.unit) {
      const remaining = current.number - used.number
      if (remaining <= 0) {
        await supabase
          .from('ingredients')
          .update({ consumed_at: new Date().toISOString() })
          .eq('id', ingredient_id)
      } else {
        await supabase
          .from('ingredients')
          .update({ quantity: formatQuantity(remaining, current.unit) })
          .eq('id', ingredient_id)
      }
    }
  }

  revalidatePath('/')
}
