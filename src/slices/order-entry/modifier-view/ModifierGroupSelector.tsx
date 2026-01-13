// ModifierGroupSelector - Grid of modifier group buttons

import { cn } from '@/slices/shared/utils/cn'
import { Lock } from 'lucide-react'
import { useEditingItem, useEditingProduct } from '../shared/machines'
import type { ToppingCategory } from '../shared/types'

interface ModifierGroupSelectorProps {
  activeCategory: ToppingCategory | null
  onSelectCategory: (category: ToppingCategory) => void
  isCategoryLocked?: (category: ToppingCategory) => boolean
  firstUnsatisfied?: ToppingCategory | null
}

export function ModifierGroupSelector({
  activeCategory,
  onSelectCategory,
  isCategoryLocked,
  firstUnsatisfied,
}: ModifierGroupSelectorProps) {
  const product = useEditingProduct()
  const item = useEditingItem()

  const categories = product?.toppingCategories ?? []

  // Count modifiers per category from cart item
  const getModifierCount = (categoryId: string): number => {
    if (!item) return 0
    // Get toppings that belong to this category
    const category = categories.find((c) => c.id === categoryId)
    if (!category?.toppings) return 0
    const toppingIds = new Set(category.toppings.map((t) => t.id))
    return item.modifiers.filter((m) => toppingIds.has(m.topping.id)).length
  }

  // Check if category is unsatisfied (mandatory with no selections)
  const isUnsatisfied = (category: ToppingCategory): boolean => {
    if (!category.isMandatory) return false
    return getModifierCount(category.id) === 0
  }

  if (categories.length === 0) {
    return (
      <div className="text-base-content/50 flex h-full items-center justify-center">
        No modifier groups available
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Show message when there are unsatisfied mandatory categories */}
      {firstUnsatisfied && (
        <div className="alert alert-warning mb-4">
          <span>
            Please select a modifier from{' '}
            <strong>{firstUnsatisfied.name}</strong> before accessing optional
            modifiers.
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {categories.map((category) => {
          const isActive = activeCategory?.id === category.id
          const modCount = getModifierCount(category.id)
          const hasSelections = modCount > 0
          const unsatisfied = isUnsatisfied(category)
          const isLocked = isCategoryLocked?.(category) ?? false

          return (
            <button
              key={category.id}
              onClick={() => !isLocked && onSelectCategory(category)}
              disabled={isLocked}
              className={cn(
                'btn relative h-16 text-lg',
                isLocked
                  ? 'btn-disabled cursor-not-allowed opacity-50'
                  : isActive
                    ? 'btn-info text-info-content'
                    : hasSelections
                      ? 'btn-neutral text-neutral-content'
                      : 'bg-base-300 text-base-content/60',
                unsatisfied && !isActive && 'ring-2 ring-error'
              )}
            >
              {isLocked && (
                <Lock className="absolute left-2 top-2 h-4 w-4 text-warning" />
              )}
              <span className="flex flex-col items-center">
                <span>{category.name}</span>
                {category.isMandatory && !hasSelections && (
                  <span className="text-xs text-error">Required</span>
                )}
                {hasSelections && (
                  <span className="text-xs opacity-70">
                    ({modCount} selected)
                  </span>
                )}
                {isLocked && (
                  <span className="text-xs text-warning">Locked</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
