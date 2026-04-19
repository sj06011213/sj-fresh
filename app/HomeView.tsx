'use client'

import { useMemo, useState } from 'react'
import type {
  Expense,
  Ingredient,
  ShoppingItem,
  Usage,
} from '@/lib/supabase'
import ExpenseView from './ExpenseView'
import IngredientList from './IngredientList'
import ShoppingList from './ShoppingList'

type Mode = 'ingredients' | 'shopping' | 'expenses'

export default function HomeView({
  ingredients,
  usages,
  shoppingItems,
  expenses,
}: {
  ingredients: Ingredient[]
  usages: Usage[]
  shoppingItems: ShoppingItem[]
  expenses: Expense[]
}) {
  const [mode, setMode] = useState<Mode>('ingredients')

  const unboughtCount = useMemo(
    () => shoppingItems.filter((i) => !i.bought_at).length,
    [shoppingItems],
  )

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md py-2 text-sm font-medium transition ${
      active
        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
        : 'text-zinc-500'
    }`

  return (
    <>
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => setMode('ingredients')}
          className={tabClass(mode === 'ingredients')}
        >
          🥬 재료
        </button>
        <button
          type="button"
          onClick={() => setMode('shopping')}
          className={tabClass(mode === 'shopping')}
        >
          🛒 구매
          {unboughtCount > 0 && (
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                mode === 'shopping'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                  : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
              }`}
            >
              {unboughtCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setMode('expenses')}
          className={tabClass(mode === 'expenses')}
        >
          💰 가계부
        </button>
      </div>

      {mode === 'ingredients' && (
        <IngredientList ingredients={ingredients} usages={usages} />
      )}
      {mode === 'shopping' && <ShoppingList items={shoppingItems} />}
      {mode === 'expenses' && <ExpenseView expenses={expenses} />}
    </>
  )
}
