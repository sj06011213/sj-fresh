'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function addIngredient(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const quantity = String(formData.get('quantity') ?? '').trim()
  const expiry = String(formData.get('expiry_date') ?? '')
  if (!name) return

  await supabase.from('ingredients').insert({
    name,
    quantity: quantity || null,
    expiry_date: expiry || null,
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
