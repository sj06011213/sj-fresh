import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(url, key)

export type Category = 'fridge' | 'freezer' | 'pantry'

export const CATEGORY_LABELS: Record<Category, string> = {
  fridge: '냉장',
  freezer: '냉동',
  pantry: '팬트리',
}

export type Ingredient = {
  id: string
  name: string
  quantity: string | null
  category: Category
  added_at: string
  expiry_date: string | null
  opened_at: string | null
  memo: string | null
  photo_url: string | null
  consumed_at: string | null
  created_at: string
  sort_order: number
}

export type Usage = {
  id: string
  ingredient_id: string
  amount: string | null
  used_at: string
  memo: string | null
  created_at: string
}

export type ShoppingItem = {
  id: string
  name: string
  quantity: string | null
  memo: string | null
  bought_at: string | null
  deleted_at: string | null
  created_at: string
}

export type ExpenseCategory =
  | 'groceries'
  | 'dining'
  | 'delivery'
  | 'snack'
  | 'alcohol'

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'groceries',
  'dining',
  'delivery',
  'alcohol',
  'snack',
] as const

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  groceries: '식자재',
  dining: '외식',
  delivery: '배달',
  snack: '카페·간식',
  alcohol: '음주',
}

export const EXPENSE_CATEGORY_EMOJIS: Record<ExpenseCategory, string> = {
  groceries: '🛒',
  dining: '🍽',
  delivery: '🛵',
  snack: '☕',
  alcohol: '🍺',
}

export type Expense = {
  id: string
  spent_at: string
  amount: number
  category: ExpenseCategory
  description: string
  place: string | null
  memo: string | null
  deleted_at: string | null
  created_at: string
}

export type EventOwner = 'me' | 'partner' | 'both'

export const EVENT_OWNERS: readonly EventOwner[] = ['me', 'partner', 'both'] as const

export const EVENT_OWNER_LABELS: Record<EventOwner, string> = {
  me: '수진',
  partner: '종빈',
  both: 'SJB',
}

export const EVENT_OWNER_EMOJIS: Record<EventOwner, string> = {
  me: '🩷',
  partner: '💙',
  both: '💛',
}

export type Event = {
  id: string
  title: string
  event_date: string              // YYYY-MM-DD (시작일)
  event_time: string | null       // HH:MM:SS or null(= all-day)
  end_date: string | null         // NULL = 단일 날짜, NOT NULL = 기간 일정(event_date~end_date)
  owner: EventOwner
  memo: string | null
  deleted_at: string | null
  created_at: string
}
