// ModifierHeader - Quantity controls and action buttons

import { useState } from 'react'
import { Minus, Plus, Trash2, X, Check } from 'lucide-react'
import {
  useEditingItem,
  useEditingProduct,
  useModifierActions,
} from '../shared/machines'
import { SpecialRequestDialog } from './SpecialRequestDialog'

interface ModifierHeaderProps {
  onConfirm: () => void
  onCancel: () => void
  onDelete: () => void
}

export function ModifierHeader({
  onConfirm,
  onCancel,
  onDelete,
}: ModifierHeaderProps) {
  const item = useEditingItem()
  const product = useEditingProduct()
  const { setQuantity, addSpecialRequest } = useModifierActions()
  const [showSpecialRequest, setShowSpecialRequest] = useState(false)

  const quantity = item?.quantity ?? 1
  const allowSpecialRequest = product?.allowSpecialRequest ?? false

  // Validation: check if size is required
  const hasSizes = (product?.assignedSizes?.length ?? 0) > 0
  const isSizeRequired = hasSizes && !item?.size

  // Validation: check mandatory topping categories
  const unsatisfiedGroups: string[] = []
  if (product?.toppingCategories && item) {
    for (const category of product.toppingCategories) {
      if (category.isMandatory) {
        const toppingIds = new Set(category.toppings?.map((t) => t.id) ?? [])
        const hasSelection = item.modifiers.some((m) =>
          toppingIds.has(m.topping.id)
        )
        if (!hasSelection) {
          unsatisfiedGroups.push(category.name)
        }
      }
    }
  }

  const isValid = !isSizeRequired && unsatisfiedGroups.length === 0

  const getValidationMessage = () => {
    const missing: string[] = []
    if (isSizeRequired) missing.push('Size')
    missing.push(...unsatisfiedGroups)
    return `Select required: ${missing.join(', ')}`
  }

  return (
    <div className="border-base-300 bg-base-100 flex items-center justify-between border-b px-4 py-2">
      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <button
          className="btn btn-circle btn-ghost btn-sm"
          onClick={() => setQuantity(quantity - 1)}
          disabled={quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="bg-base-200 min-w-12 rounded px-3 py-1 text-center font-mono">
          {quantity}
        </span>
        <button
          className="btn btn-circle btn-ghost btn-sm"
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setShowSpecialRequest(true)}
          title={
            allowSpecialRequest
              ? 'Add Special Request'
              : 'Special request not allowed for this item'
          }
        >
          Special Request
        </button>
        <button
          className="btn btn-ghost btn-sm text-error"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onCancel}
          title="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={onConfirm}
          disabled={!isValid}
          title={isValid ? 'Confirm' : getValidationMessage()}
        >
          <Check className="h-5 w-5" />
        </button>
      </div>

      {/* Special Request Dialog */}
      <SpecialRequestDialog
        isOpen={showSpecialRequest}
        onClose={() => setShowSpecialRequest(false)}
        onSave={(description: string, price: number) => {
          if (!allowSpecialRequest) {
            alert('Special request is not allowed for this item')
            return
          }
          addSpecialRequest({
            id: crypto.randomUUID(),
            description,
            price,
          })
        }}
      />
    </div>
  )
}
