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
}
