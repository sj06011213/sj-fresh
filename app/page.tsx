import { supabase, type Ingredient } from '@/lib/supabase'
import { consumeIngredient } from './actions'
import AddIngredientButton from './AddIngredientButton'

export const dynamic = 'force-dynamic'

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((target.getTime() - today.getTime()) / 86_400_000)
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const past = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - past.getTime()) / 86_400_000)
}

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

      <ul className="flex flex-col gap-2">
        {ingredients.length === 0 && !error && (
          <li className="py-12 text-center text-zinc-400">
            아직 재료가 없어요.
            <br />
            오른쪽 아래 + 버튼으로 추가해보세요!
          </li>
        )}
        {ingredients.map((ing) => {
          const d = daysUntil(ing.expiry_date)
          const badge =
            d === null ? '' : d < 0 ? `D+${-d}` : d === 0 ? 'D-day' : `D-${d}`
          const urgent = d !== null && d <= 3
          const opened = daysSince(ing.opened_at)
          return (
            <li
              key={ing.id}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                urgent
                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-950'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {ing.name}
                  {ing.quantity && (
                    <span className="ml-2 text-sm font-normal text-zinc-500">
                      · {ing.quantity}
                    </span>
                  )}
                </span>
                {ing.expiry_date && (
                  <span
                    className={`text-sm ${
                      urgent
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-zinc-500'
                    }`}
                  >
                    🗓️ {ing.expiry_date} · {badge}
                  </span>
                )}
                {ing.opened_at && !ing.expiry_date && (
                  <span className="text-sm text-zinc-500">
                    📦 {ing.opened_at} 개봉 ·{' '}
                    {opened === null
                      ? ''
                      : opened === 0
                      ? '오늘'
                      : `${opened}일차`}
                  </span>
                )}
              </div>
              <form action={consumeIngredient}>
                <input type="hidden" name="id" value={ing.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
                >
                  소비
                </button>
              </form>
            </li>
          )
        })}
      </ul>

      <AddIngredientButton />
    </main>
  )
}
