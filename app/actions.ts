'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function addIngredient(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const quantity = String(formData.get('quantity') ?? '').trim()
  const dateType = String(formData.get('date_type') ?? 'expiry')
  const date = String(formData.get('date') ?? '')
  if (!name) return

  await supabase.from('ingredients').insert({
    name,
    quantity: quantity || null,
    expiry_date: dateType === 'expiry' && date ? date : null,
    opened_at: dateType === 'opened' && date ? date : null,
  })

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
