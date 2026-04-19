'use client'

import { useMemo, useState } from 'react'
import type { Ingredient, ShoppingItem, Usage } from '@/lib/supabase'
import IngredientList from './IngredientList'
import ShoppingList from './ShoppingList'

type Mode = 'ingredients' | 'shopping'

export default function HomeView({
  ingredients,
  usages,
  shoppingItems,
}: {
  ingredients: Ingredient[]
  usages: Usage[]
  shoppingItems: ShoppingItem[]
}) {
  const [mode, setMode] = useState<Mode>('ingredients')

  const unboughtCount = useMemo(
    () => shoppingItems.filter((i) => !i.bought_at).length,
    [shoppingItems],
  )

  return (
    <>
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => setMode('ingredients')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === 'ingredients'
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
              : 'text-zinc-500'
          }`}
        >
          🥬 재료
        </button>
        <button
          type="button"
          onClick={() => setMode('shopping')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            mode === 'shopping'
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
              : 'text-zinc-500'
          }`}
        >
          🛒 장볼거리
          {unboughtCount > 0 && (
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                mode === 'shopping'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                  : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
              }`}
            >
              {unboughtCount}
            </span>
          )}
        </button>
      </div>

      {mode === 'ingredients' ? (
        <IngredientList ingredients={ingredients} usages={usages} />
      ) : (
        <ShoppingList items={shoppingItems} />
      )}
    </>
  )
}
