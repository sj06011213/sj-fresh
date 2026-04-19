'use server'

import { revalidatePath } from 'next/cache'
import {
  EXPENSE_CATEGORIES,
  supabase,
  type ExpenseCategory,
} from '@/lib/supabase'

function assertOk(error: { message: string } | null, verb: string): void {
  if (error) throw new Error(`${verb} 실패: ${error.message}`)
}

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
  assertOk(error, '지출 기록')

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

  if (!id) return
  if (!description) throw new Error('설명을 입력해주세요.')
  if (amount === null) throw new Error('금액을 숫자로 입력해주세요.')
  if (!spent_at) throw new Error('날짜를 입력해주세요.')

  const { error } = await supabase
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
  assertOk(error, '지출 수정')

  revalidatePath('/')
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  assertOk(error, '지출 삭제')

  revalidatePath('/')
}

export async function restoreExpense(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: null })
    .eq('id', id)
  assertOk(error, '지출 복구')

  revalidatePath('/')
}
