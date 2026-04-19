import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(url, key)

export type Ingredient = {
  id: string
  name: string
  quantity: string | null
  added_at: string
  expiry_date: string | null
  photo_url: string | null
  consumed_at: string | null
  created_at: string
}
