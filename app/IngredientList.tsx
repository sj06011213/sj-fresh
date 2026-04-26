'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CATEGORY_LABELS,
  type Category,
  type Ingredient,
} from '@/lib/supabase'
import { consumeIngredient, reorderIngredients } from './actions/ingredients'
import AddIngredientButton from './AddIngredientButton'
import EditIngredientDialog from './EditIngredientDialog'
import RecordUsageButton from './RecordUsageButton'

type SortMode = 'expiry' | 'oldest' | 'custom'

export type CategoryFilter = Category | 'all'

const CATEGORY_FILTERS: CategoryFilter[] = ['all', 'fridge', 'freezer', 'pantry']

const CATEGORY_FILTER_LABELS: Record<CategoryFilter, string> = {
  all: '전체',
  fridge: CATEGORY_LABELS.fridge,
  freezer: CATEGORY_LABELS.freezer,
  pantry: CATEGORY_LABELS.pantry,
}

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

export default function IngredientList({
  ingredients,
  selected,
  onSelectedChange,
}: {
  ingredients: Ingredient[]
  selected: CategoryFilter
  onSelectedChange: (next: CategoryFilter) => void
}) {
  const [sortMode, setSortMode] = useState<SortMode>('expiry')
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [localOrder, setLocalOrder] = useState<string[] | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  // Reset user's drag-drop order whenever server data refreshes.
  // Render-phase state sync per React docs ("Adjusting state on prop change").
  const [prevIngredients, setPrevIngredients] = useState(ingredients)
  if (ingredients !== prevIngredients) {
    setPrevIngredients(ingredients)
    setLocalOrder(null)
  }

  // Exit reorder mode whenever the user leaves the custom sort.
  const [prevSortMode, setPrevSortMode] = useState(sortMode)
  if (prevSortMode !== sortMode) {
    setPrevSortMode(sortMode)
    if (sortMode !== 'custom' && isReordering) setIsReordering(false)
  }

  const counts = useMemo(() => {
    const c: Record<CategoryFilter, number> = {
      all: ingredients.length,
      fridge: 0,
      freezer: 0,
      pantry: 0,
    }
    for (const ing of ingredients) {
      c[ing.category] = (c[ing.category] ?? 0) + 1
    }
    return c
  }, [ingredients])

  const filtered = useMemo(() => {
    const arr =
      selected === 'all'
        ? [...ingredients]
        : ingredients.filter((ing) => ing.category === selected)
    if (sortMode === 'oldest') {
      arr.sort((a, b) => a.added_at.localeCompare(b.added_at))
    } else if (sortMode === 'custom') {
      arr.sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
        return b.created_at.localeCompare(a.created_at)
      })
    } else {
      arr.sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0
        if (!a.expiry_date) return 1
        if (!b.expiry_date) return -1
        return a.expiry_date.localeCompare(b.expiry_date)
      })
    }
    return arr
  }, [ingredients, selected, sortMode])

  const displayed = useMemo(() => {
    if (sortMode !== 'custom' || !localOrder) return filtered
    const byId = new Map(filtered.map((i) => [i.id, i]))
    const ordered: Ingredient[] = []
    const seen = new Set<string>()
    for (const id of localOrder) {
      const ing = byId.get(id)
      if (ing) {
        ordered.push(ing)
        seen.add(id)
      }
    }
    for (const ing of filtered) {
      if (!seen.has(ing.id)) ordered.push(ing)
    }
    return ordered
  }, [filtered, sortMode, localOrder])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = displayed.findIndex((i) => i.id === active.id)
    const newIndex = displayed.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(displayed, oldIndex, newIndex).map((i) => i.id)
    setLocalOrder(newOrder)
    void reorderIngredients(newOrder)
  }

  const isReorderMode = sortMode === 'custom' && isReordering

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectedChange(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              cat === 'all' ? 'mr-2' : ''
            } ${
              selected === cat
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            {CATEGORY_FILTER_LABELS[cat]}{' '}
            <span className="opacity-60">· {counts[cat]}</span>
          </button>
        ))}
      </div>

      <div className="mb-2 flex justify-end gap-4 text-xs">
        {(
          [
            { value: 'expiry', label: '⏰ 임박순' },
            { value: 'oldest', label: '📅 오래된순' },
            { value: 'custom', label: '✋ 내 순서' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSortMode(opt.value)}
            className={`transition ${
              sortMode === opt.value
                ? 'font-medium text-zinc-900 underline decoration-2 underline-offset-4 dark:text-white'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {sortMode === 'custom' && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setIsReordering((v) => !v)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              isReordering
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            {isReordering ? '✅ 완료' : '✏️ 순서 편집'}
          </button>
        </div>
      )}

      {displayed.length === 0 ? (
        <ul className="flex flex-col gap-2">
          <li className="py-12 text-center text-zinc-400">
            {selected === 'all'
              ? '재료가 아직 없어요.'
              : `${CATEGORY_LABELS[selected]} 재료가 아직 없어요.`}
            <br />
            오른쪽 아래 + 버튼으로 추가해보세요!
          </li>
        </ul>
      ) : isReorderMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayed.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {displayed.map((ing) => (
                <SortableCard
                  key={ing.id}
                  ingredient={ing}
                  onEdit={() => setEditing(ing)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="flex flex-col gap-2">
          {displayed.map((ing) => (
            <li key={ing.id}>
              <IngredientRow
                ingredient={ing}
                onEdit={() => setEditing(ing)}
              />
            </li>
          ))}
        </ul>
      )}

      <AddIngredientButton
        defaultCategory={selected === 'all' ? 'fridge' : selected}
      />
      <RecordUsageButton ingredients={ingredients} />

      {editing && (
        <EditIngredientDialog
          ingredient={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function IngredientRow({
  ingredient,
  onEdit,
  dragHandle,
}: {
  ingredient: Ingredient
  onEdit: () => void
  dragHandle?: React.ReactNode
}) {
  const d = daysUntil(ingredient.expiry_date)
  const badge =
    d === null ? '' : d < 0 ? `D+${-d}` : d === 0 ? 'D-day' : `D-${d}`
  const urgent = d !== null && d <= 3
  const opened = daysSince(ingredient.opened_at)

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-3 ${
        urgent
          ? 'border-rose-400 bg-rose-50 dark:bg-rose-950'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {dragHandle}
      <button
        type="button"
        onClick={onEdit}
        className="flex flex-1 flex-col items-start text-left"
      >
        <span className="font-medium">
          {ingredient.name}
          {ingredient.quantity && (
            <span className="ml-2 text-sm font-normal text-zinc-500">
              · {ingredient.quantity}
            </span>
          )}
        </span>
        {ingredient.expiry_date && (
          <span
            className={`text-sm ${
              urgent ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500'
            }`}
          >
            🗓️ {ingredient.expiry_date} · {badge}
          </span>
        )}
        {ingredient.opened_at && !ingredient.expiry_date && (
          <span className="text-sm text-zinc-500">
            📦 {ingredient.opened_at} 개봉 ·{' '}
            {opened === null ? '' : opened === 0 ? '오늘' : `${opened}일차`}
          </span>
        )}
        {ingredient.memo && (
          <span className="mt-1 line-clamp-1 text-xs text-zinc-400">
            📝 {ingredient.memo}
          </span>
        )}
      </button>
      <form action={consumeIngredient} className="ml-2">
        <input type="hidden" name="id" value={ingredient.id} />
        <button
          type="submit"
          className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
        >
          소비
        </button>
      </form>
    </div>
  )
}

function SortableCard({
  ingredient,
  onEdit,
}: {
  ingredient: Ingredient
  onEdit: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ingredient.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style}>
      <IngredientRow
        ingredient={ingredient}
        onEdit={onEdit}
        dragHandle={
          <button
            type="button"
            aria-label="드래그로 순서 바꾸기"
            className="mr-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none', cursor: 'grab' }}
          >
            ☰
          </button>
        }
      />
    </li>
  )
}
