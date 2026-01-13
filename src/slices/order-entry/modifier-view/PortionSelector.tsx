// PortionSelector - Grid of portion buttons (multi-select for half/half)

import { cn } from '@/slices/shared/utils/cn'
import {
  useEditingItem,
  useEditingProduct,
  useModifierActions,
} from '../shared/machines'
import type { PortionType } from '../shared/types'

interface PortionSelectorProps {
  onAdvance: () => void
}

export function PortionSelector({ onAdvance }: PortionSelectorProps) {
  const product = useEditingProduct()
  const item = useEditingItem()
  const { setPortions } = useModifierActions()

  const portions = product?.portionTypes ?? []
  const selectedPortionIds = item?.portions.map((p) => p.portionType.id) ?? []

  if (portions.length === 0) {
    return (
      <div className="text-base-content/50 flex h-full items-center justify-center">
        No portions available
      </div>
    )
  }

  const handleSelect = (portion: PortionType) => {
    const isSelected = selectedPortionIds.includes(portion.id)
    let newPortions: PortionType[]

    if (isSelected) {
      // Deselect
      newPortions = (item?.portions ?? [])
        .filter((p) => p.portionType.id !== portion.id)
        .map((p) => p.portionType)
    } else {
      // Select - add to current portions
      const currentPortions = (item?.portions ?? []).map((p) => p.portionType)
      newPortions = [...currentPortions, portion]
      onAdvance()
    }

    setPortions(newPortions)
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3">
        {portions.map((portion) => {
          const isSelected = selectedPortionIds.includes(portion.id)

          return (
            <button
              key={portion.id}
              onClick={() => handleSelect(portion)}
              className={cn(
                'btn h-16 text-lg',
                isSelected
                  ? 'btn-info text-info-content'
                  : 'btn-neutral text-neutral-content'
              )}
            >
              {portion.name}
              {portion.price > 0 && (
                <span className="ml-2 text-sm opacity-70">
                  +${portion.price.toFixed(2)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
