// TypeSelector - Grid of type buttons (reads from cart item, writes via machine)

import { cn } from '@/slices/shared/utils/cn'
import {
  useEditingItem,
  useEditingProduct,
  useModifierActions,
} from '../shared/machines'
import type { ProductType } from '../shared/types'

interface TypeSelectorProps {
  onAdvance: () => void
}

export function TypeSelector({ onAdvance }: TypeSelectorProps) {
  const product = useEditingProduct()
  const item = useEditingItem()
  const { setType } = useModifierActions()

  const types = product?.productTypes ?? []

  if (types.length === 0) {
    return (
      <div className="text-base-content/50 flex h-full items-center justify-center">
        No types available
      </div>
    )
  }

  const handleSelect = (type: ProductType) => {
    setType(type)
    onAdvance()
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3">
        {types.map((type) => {
          // Read selected type from cart item
          const isSelected = item?.type?.id === type.id

          return (
            <button
              key={type.id}
              onClick={() => handleSelect(type)}
              className={cn(
                'btn h-16 text-lg',
                isSelected
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'btn-neutral text-neutral-content'
              )}
            >
              {type.name}
              {type.price > 0 && (
                <span className="ml-2 text-sm opacity-70">
                  +${type.price.toFixed(2)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
