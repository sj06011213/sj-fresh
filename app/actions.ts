'use server'

import { revalidatePath } from 'next/cache'
import { supabase, type Category } from '@/lib/supabase'

const VALID_CATEGORIES: Category[] = ['fridge', 'freezer', 'pantry']

function parseCategory(raw: string): Category {
  return (VALID_CATEGORIES as string[]).includes(raw)
    ? (raw as Category)
    : 'fridge'
}

export async function addIngredient(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const quantity = String(formData.get('quantity') ?? '').trim()
  const category = parseCategory(String(formData.get('category') ?? ''))
  const dateType = String(formData.get('date_type') ?? 'expiry')
  const date = String(formData.get('date') ?? '')
  const memo = String(formData.get('memo') ?? '').trim()
  if (!name) return

  await supabase.from('ingredients').insert({
    name,
    quantity: quantity || null,
    category,
    expiry_date: dateType === 'expiry' && date ? date : null,
    opened_at: dateType === 'opened' && date ? date : null,
    memo: memo || null,
  })

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
  if (!id || !name) return

  await supabase
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

  revalidatePath('/')
}

export async function recordUsage(formData: FormData) {
  const ingredient_id = String(formData.get('ingredient_id') ?? '')
  const amount = String(formData.get('amount') ?? '').trim()
  const used_at =
    String(formData.get('used_at') ?? '') ||
    new Date().toISOString().slice(0, 10)
  const memo = String(formData.get('memo') ?? '').trim()

  if (!ingredient_id) return

  await supabase.from('usages').insert({
    ingredient_id,
    amount: amount || null,
    used_at,
    memo: memo || null,
  })

  revalidatePath('/')
}

export async function addShoppingItem(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const quantity = String(formData.get('quantity') ?? '').trim()
  const memo = String(formData.get('memo') ?? '').trim()
  if (!name) return

  await supabase.from('shopping_items').insert({
    name,
    quantity: quantity || null,
    memo: memo || null,
  })

  revalidatePath('/')
}

export async function toggleShoppingItem(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const currentlyBought = formData.get('currently_bought') === 'true'
  if (!id) return

  await supabase
    .from('shopping_items')
    .update({
      bought_at: currentlyBought ? null : new Date().toISOString(),
    })
    .eq('id', id)

  revalidatePath('/')
}

export async function consumeIngredient(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase
    .from('ingredients')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/')
}
