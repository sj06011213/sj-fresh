'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import type {
  Category,
  Expense,
  Ingredient,
  ShoppingItem,
} from '@/lib/supabase'
import ExpenseView from './ExpenseView'
import IngredientList, { type CategoryFilter } from './IngredientList'
import ShoppingList from './ShoppingList'

type Mode = 'ingredients' | 'shopping' | 'expenses'

export default function HomeView({
  ingredients,
  shoppingItems,
  expenses,
}: {
  ingredients: Ingredient[]
  shoppingItems: ShoppingItem[]
  expenses: Expense[]
}) {
  const [mode, setMode] = useState<Mode>('ingredients')
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('fridge')

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

  function handleLogoClick() {
    setMode('ingredients')
    setSelectedCategory('all')
  }

  function handleSelectCategoryOrAll(next: Category | 'all') {
    setSelectedCategory(next)
  }

  return (
    <>
      <header className="mb-6 flex justify-center">
        <h1 className="sr-only">수진프레시</h1>
        <button
          type="button"
          onClick={handleLogoClick}
          aria-label="수진프레시 홈 — 전체 재료 보기"
          className="rounded-full p-1 transition hover:opacity-80 active:scale-95"
        >
          <Image
            src="/logo.png"
            alt="수진프레시"
            width={912}
            height={871}
            priority
            className="h-14 w-auto dark:invert"
          />
        </button>
      </header>

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
        <IngredientList
          ingredients={ingredients}
          selected={selectedCategory}
          onSelectedChange={handleSelectCategoryOrAll}
        />
      )}
      {mode === 'shopping' && <ShoppingList items={shoppingItems} />}
      {mode === 'expenses' && <ExpenseView expenses={expenses} />}
    </>
  )
}
