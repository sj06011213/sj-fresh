import {
  supabase,
  type Expense,
  type Ingredient,
  type ShoppingItem,
  type Usage,
} from '@/lib/supabase'
import HomeView from './HomeView'

export const dynamic = 'force-dynamic'

export default async function Home() {
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
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <path d="M5 10h14" />
            <path d="M9 6v1" />
            <path d="M9 14v2" />
          </svg>
          수진프레시
        </h1>
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
