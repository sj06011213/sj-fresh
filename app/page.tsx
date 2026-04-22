import {
  supabase,
  type Event,
  type Expense,
  type Ingredient,
  type ShoppingItem,
} from '@/lib/supabase'
import HomeView from './HomeView'

export const dynamic = 'force-dynamic'

// Shopping items stay visible until 1 day after they're checked as bought.
const SHOPPING_BOUGHT_RETENTION_MS = 24 * 60 * 60 * 1000

function shoppingRetentionCutoff(): string {
  return new Date(Date.now() - SHOPPING_BOUGHT_RETENTION_MS).toISOString()
}

export default async function Home() {
  // Server component runs per request (dynamic = 'force-dynamic') — request-time
  // current time is intentional; extracted from the render body to satisfy
  // react-hooks/purity.
  const shoppingCutoff = shoppingRetentionCutoff()

  const [ingredientsRes, shoppingRes, expensesRes, eventsRes] =
    await Promise.all([
      supabase
        .from('ingredients')
        .select('*')
        .is('consumed_at', null)
        .order('expiry_date', { ascending: true, nullsFirst: false }),
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
      supabase
        .from('events')
        .select('*')
        .is('deleted_at', null)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true, nullsFirst: true }),
    ])

  const { data, error } = ingredientsRes
  const ingredients = (data ?? []) as Ingredient[]
  const shoppingItems = (shoppingRes.data ?? []) as ShoppingItem[]
  const expenses = (expensesRes.data ?? []) as Expense[]
  const events = (eventsRes.data ?? []) as Event[]

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          DB 오류: {error.message}
        </p>
      )}

      <HomeView
        ingredients={ingredients}
        shoppingItems={shoppingItems}
        expenses={expenses}
        events={events}
      />
    </main>
  )
}
