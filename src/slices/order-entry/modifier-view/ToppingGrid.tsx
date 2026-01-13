// ToppingGrid - Grid of individual topping buttons

import { useMemo, useCallback } from 'react'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/slices/shared/utils/cn'
import { useEditingItem, useModifierActions } from '../shared/machines'
import type {
  ToppingCategory,
  Topping,
  CartItemModifier,
} from '../shared/types'

interface ToppingGridProps {
  activeCategory: ToppingCategory | null
  isLocked?: boolean
  lockReason?: string
  onGoToRequired?: () => void
}

export function ToppingGrid({
  activeCategory,
  isLocked = false,
  lockReason,
  onGoToRequired,
}: ToppingGridProps) {
  const item = useEditingItem()
  const { setModifiers } = useModifierActions()

  if (!activeCategory) {
    return (
      <div className="text-base-content/50 flex h-full items-center justify-center">
        Select a modifier group first
      </div>
    )
  }

  // Show locked overlay when mandatory modifiers not satisfied
  if (isLocked) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <Lock className="h-12 w-12 text-warning" />
        <div className="text-center">
          <p className="text-lg font-semibold">Optional Modifiers Locked</p>
          <p className="text-base-content/70 mt-2">
            Please select a required modifier from{' '}
            <span className="font-bold text-warning">{lockReason}</span> first.
          </p>
        </div>
        <button
          className="btn btn-warning btn-outline mt-4"
          onClick={onGoToRequired}
        >
          Go to Required Modifiers
        </button>
      </div>
    )
  }

  const toppings = activeCategory.toppings ?? []

  // Get selected topping IDs from cart item (memoized with Set for O(1) lookup)
  const selectedIds = useMemo(() => {
    if (!item) return new Set<string>()
    const toppingIds = new Set(toppings.map((t) => t.id))
    return new Set(
      item.modifiers
        .filter((m) => toppingIds.has(m.topping.id))
        .map((m) => m.topping.id)
    )
  }, [item?.modifiers, toppings])

  if (toppings.length === 0) {
    return (
      <div className="text-base-content/50 flex h-full items-center justify-center">
        No modifiers in this group
      </div>
    )
  }

  const handleToggle = useCallback(
    (topping: Topping) => {
      if (!item) return

      const isSelected = selectedIds.has(topping.id)
      let newModifiers: CartItemModifier[]

      if (isSelected) {
        // Deselect - remove this topping
        newModifiers = item.modifiers.filter((m) => m.topping.id !== topping.id)
      } else if (activeCategory.canAddMultiple) {
        // Multi-select: add to existing
        const newMod: CartItemModifier = {
          id: crypto.randomUUID(),
          topping,
          quantity: 1,
        }
        newModifiers = [...item.modifiers, newMod]
      } else {
        // Single-select: remove other toppings from this category, add new one
        const categoryToppingIds = new Set(toppings.map((t) => t.id))
        const otherMods = item.modifiers.filter(
          (m) => !categoryToppingIds.has(m.topping.id)
        )
        const newMod: CartItemModifier = {
          id: crypto.randomUUID(),
          topping,
          quantity: 1,
        }
        newModifiers = [...otherMods, newMod]
      }

      setModifiers(newModifiers)
    },
    [item, selectedIds, activeCategory, toppings, setModifiers]
  )

  return (
    <div className="p-4">
      {/* Group name header */}
      <div className="mb-4">
        <span className="bg-base-200 rounded px-3 py-1 text-sm font-medium">
          Selected Group:{' '}
          <span className="font-bold">{activeCategory.name}</span>
        </span>
        {!activeCategory.canAddMultiple && (
          <span className="text-base-content/50 ml-2 text-xs">
            (Single select)
          </span>
        )}
      </div>

      {/* Toppings grid */}
      <div className="grid grid-cols-4 gap-3">
        {toppings.map((topping) => {
          const isSelected = selectedIds.has(topping.id)

          return (
            <button
              key={topping.id}
              onClick={() => handleToggle(topping)}
              className={cn(
                'btn relative h-16',
                isSelected
                  ? 'btn-info text-info-content'
                  : 'btn-neutral text-neutral-content'
              )}
            >
              <span className="flex flex-col items-center">
                <span>{topping.name}</span>
                {Number(topping.price) > 0 && (
                  <span className="text-xs opacity-70">
                    +${Number(topping.price).toFixed(2)}
                  </span>
                )}
              </span>

              {/* Selection indicator */}
              {activeCategory.canAddMultiple ? (
                // Checkbox style for multi-select
                isSelected && (
                  <Check className="absolute right-2 top-2 h-4 w-4" />
                )
              ) : (
                // Radio style for single-select
                <div
                  className={cn(
                    'absolute right-2 top-2 h-3 w-3 rounded-full border-2',
                    isSelected
                      ? 'border-info-content bg-info-content'
                      : 'border-current opacity-30'
                  )}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
