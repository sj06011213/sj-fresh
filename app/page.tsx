import {
  supabase,
  type Ingredient,
  type ShoppingItem,
  type Usage,
} from '@/lib/supabase'
import HomeView from './HomeView'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [ingredientsRes, usagesRes, shoppingRes] = await Promise.all([
    supabase
      .from('ingredients')
      .select('*')
      .is('consumed_at', null)
      .order('expiry_date', { ascending: true, nullsFirst: false }),
    supabase.from('usages').select('*').order('used_at', { ascending: false }),
    supabase
      .from('shopping_items')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const { data, error } = ingredientsRes
  const ingredients = (data ?? []) as Ingredient[]
  const usages = (usagesRes.data ?? []) as Usage[]
  const shoppingItems = (shoppingRes.data ?? []) as ShoppingItem[]

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">🥬 sj-fresh</h1>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          DB 오류: {error.message}
        </p>
      )}

      <HomeView
        ingredients={ingredients}
        usages={usages}
        shoppingItems={shoppingItems}
      />
    </main>
  )
}
