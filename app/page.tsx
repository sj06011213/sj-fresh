import Image from 'next/image'
import {
  supabase,
  type Expense,
  type Ingredient,
  type ShoppingItem,
  type Usage,
} from '@/lib/supabase'
import HomeView from './HomeView'

export const dynamic = 'force-dynamic'

// Shopping items stay visible until 1 day after they're checked as bought.
const SHOPPING_BOUGHT_RETENTION_MS = 24 * 60 * 60 * 1000

export default async function Home() {
  const shoppingCutoff = new Date(
    Date.now() - SHOPPING_BOUGHT_RETENTION_MS,
  ).toISOString()

  const [ingredientsRes, usagesRes, shoppingRes, expensesRes] =
    await Promise.all([
      supabase
        .from('ingredients')
        .select('*')
        .is('consumed_at', null)
        .order('expiry_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('usages')
        .select('*')
        .order('used_at', { ascending: false }),
      supabase
        .from('shopping_items')
        .select('*')
        .is('deleted_at', null)
        .or(`bought_at.is.null,bought_at.gt.${shoppingCutoff}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('expenses')
        .select('*')
        .is('deleted_at', null)
        .order('spent_at', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

  const { data, error } = ingredientsRes
  const ingredients = (data ?? []) as Ingredient[]
  const usages = (usagesRes.data ?? []) as Usage[]
  const shoppingItems = (shoppingRes.data ?? []) as ShoppingItem[]
  const expenses = (expensesRes.data ?? []) as Expense[]

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <header className="mb-6 flex justify-center">
        <h1 className="sr-only">수진프레시</h1>
        <Image
          src="/logo.png"
          alt="수진프레시"
          width={912}
          height={871}
          priority
          className="h-14 w-auto dark:invert"
        />
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
        expenses={expenses}
      />
    </main>
  )
}
