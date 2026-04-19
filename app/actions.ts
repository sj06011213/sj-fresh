'use server'

import { revalidatePath } from 'next/cache'
import {
  supabase,
  EXPENSE_CATEGORIES,
  type Category,
  type ExpenseCategory,
} from '@/lib/supabase'

const VALID_CATEGORIES: Category[] = ['fridge', 'freezer', 'pantry']

function parseExpenseCategory(raw: string): ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(raw)
    ? (raw as ExpenseCategory)
    : 'groceries'
}

function parseAmount(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  const n = Number.parseInt(digits, 10)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

type SupportedQuantityUnit = '개' | 'g' | 'kg' | 'ml' | 'L'

function normalizeQuantityUnit(raw: string): SupportedQuantityUnit | null {
  const lower = raw.toLowerCase()
  if (lower === 'kg') return 'kg'
  if (lower === 'ml') return 'ml'
  if (lower === 'g') return 'g'
  if (lower === 'l') return 'L'
  if (raw === '개') return '개'
  return null
}

function parseQuantity(
  raw: string | null | undefined,
): { number: number; unit: SupportedQuantityUnit } | null {
  if (!raw) return null
  const match = raw.trim().match(/^(\d+(?:\.\d+)?)\s*(개|kg|g|ml|L|l)$/i)
  if (!match) return null
  const number = Number.parseFloat(match[1])
  if (!Number.isFinite(number) || number < 0) return null
  const unit = normalizeQuantityUnit(match[2])
  if (!unit) return null
  return { number, unit }
}

function formatQuantityNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100
  return String(rounded)
}

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
          .update({
            quantity: `${formatQuantityNumber(remaining)}${current.unit}`,
          })
          .eq('id', ingredient_id)
      }
    }
  }

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

export async function updateShoppingItem(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const quantity = String(formData.get('quantity') ?? '').trim()
  const memo = String(formData.get('memo') ?? '').trim()
  if (!id || !name) return

  await supabase
    .from('shopping_items')
    .update({
      name,
      quantity: quantity || null,
      memo: memo || null,
    })
    .eq('id', id)

  revalidatePath('/')
}

export async function deleteShoppingItem(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase
    .from('shopping_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/')
}

export async function restoreShoppingItem(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase
    .from('shopping_items')
    .update({ deleted_at: null })
    .eq('id', id)

  revalidatePath('/')
}

export async function reorderIngredients(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('ingredients')
        .update({ sort_order: index })
        .eq('id', id),
    ),
  )
  revalidatePath('/')
}

export async function addExpense(formData: FormData) {
  const amount = parseAmount(String(formData.get('amount') ?? ''))
  const category = parseExpenseCategory(String(formData.get('category') ?? ''))
  const spent_at =
    String(formData.get('spent_at') ?? '') ||
    new Date().toISOString().slice(0, 10)
  const description = String(formData.get('description') ?? '').trim()
  const place = String(formData.get('place') ?? '').trim()
  const memo = String(formData.get('memo') ?? '').trim()

  if (!description) throw new Error('설명을 입력해주세요.')
  if (amount === null) throw new Error('금액을 숫자로 입력해주세요.')

  const { error } = await supabase.from('expenses').insert({
    spent_at,
    amount,
    category,
    description,
    place: place || null,
    memo: memo || null,
  })

  if (error) throw new Error(`DB 저장 실패: ${error.message}`)

  revalidatePath('/')
}

export async function updateExpense(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const amount = parseAmount(String(formData.get('amount') ?? ''))
  const category = parseExpenseCategory(String(formData.get('category') ?? ''))
  const spent_at = String(formData.get('spent_at') ?? '')
  const description = String(formData.get('description') ?? '').trim()
  const place = String(formData.get('place') ?? '').trim()
  const memo = String(formData.get('memo') ?? '').trim()

  if (!id || !description || amount === null || !spent_at) return

  await supabase
    .from('expenses')
    .update({
      spent_at,
      amount,
      category,
      description,
      place: place || null,
      memo: memo || null,
    })
    .eq('id', id)

  revalidatePath('/')
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/')
}

export async function restoreExpense(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  await supabase.from('expenses').update({ deleted_at: null }).eq('id', id)

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
