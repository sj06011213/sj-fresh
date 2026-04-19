import { supabase, type Ingredient } from '@/lib/supabase'
import AddIngredientButton from './AddIngredientButton'
import IngredientList from './IngredientList'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .is('consumed_at', null)
    .order('expiry_date', { ascending: true, nullsFirst: false })

  const ingredients = (data ?? []) as Ingredient[]

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">🥬 sj-fresh</h1>
        <p className="text-sm text-zinc-500">냉장고 속 재료를 관리하세요</p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          DB 오류: {error.message}
          <br />
          <span className="text-xs opacity-70">
            Supabase 대시보드에서 ingredients 테이블을 먼저 만들어주세요 (docs/schema.md 참고).
          </span>
        </p>
      )}

      <IngredientList ingredients={ingredients} />

      <AddIngredientButton />
    </main>
  )
}
