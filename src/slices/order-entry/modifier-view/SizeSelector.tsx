// SizeSelector - Grid of size buttons (reads from cart item, writes via machine)

import { cn } from '@/slices/shared/utils/cn'
import {
  useEditingItem,
  useEditingProduct,
  useModifierActions,
} from '../shared/machines'
import type { AssignedSize } from '../shared/types'

interface SizeSelectorProps {
  onAdvance: () => void
}

export function SizeSelector({ onAdvance }: SizeSelectorProps) {
  const product = useEditingProduct()
  const item = useEditingItem()
  const { setSize } = useModifierActions()

  const sizes = product?.assignedSizes?.filter((s) => s.isAssigned) ?? []

  if (sizes.length === 0) {
    return (
      <div className="text-base-content/50 flex h-full items-center justify-center">
        No sizes available
      </div>
    )
  }

  const handleSelect = (size: AssignedSize) => {
    setSize(size)
    onAdvance()
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3">
        {sizes.map((size) => {
          // Read selected size from cart item
          const isSelected = item?.size?.id === size.id

          return (
            <button
              key={size.id}
              onClick={() => handleSelect(size)}
              className={cn(
                'btn h-16 text-lg',
                isSelected
                  ? 'btn-info text-info-content'
                  : 'btn-neutral text-neutral-content'
              )}
            >
              {size.size?.name ?? 'Size'}
              {Number(size.price) > 0 && (
                <span className="ml-2 text-sm opacity-70">
                  ${Number(size.price).toFixed(2)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
