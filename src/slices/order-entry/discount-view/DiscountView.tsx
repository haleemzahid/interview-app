// DiscountView - Discount selection grid

import { memo } from 'react'
import { useDiscounts } from './hooks/useDiscounts'
import type { Discount } from '../shared/types'

interface DiscountViewProps {
  onSelectDiscount: (discount: Discount) => void
  onClearInvoiceDiscount: () => void
  onClearItemDiscount: () => void
  onDone: () => void
  hasSelectedItem: boolean
}

export function DiscountView({
  onSelectDiscount,
  onClearInvoiceDiscount,
  onClearItemDiscount,
  onDone,
  hasSelectedItem,
}: DiscountViewProps) {
  const { data: discounts = [], isLoading } = useDiscounts()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header with actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="btn bg-base-100"
          onClick={onClearInvoiceDiscount}
        >
          Clear Invoice Discount
        </button>
        <button
          type="button"
          className="btn bg-base-100"
          onClick={onClearItemDiscount}
          disabled={!hasSelectedItem}
        >
          Clear Item Discount
        </button>
        <button type="button" className="btn btn-neutral" onClick={onDone}>
          Done
        </button>
      </div>

      {/* Discount grid */}
      <div className="grid grid-cols-4 gap-2">
        {discounts.map((discount) => (
          <DiscountTile
            key={discount.id}
            discount={discount}
            onClick={() => onSelectDiscount(discount)}
          />
        ))}
      </div>
    </div>
  )
}

interface DiscountTileProps {
  discount: Discount
  onClick: () => void
}

const DiscountTile = memo(function DiscountTile({
  discount,
  onClick,
}: DiscountTileProps) {
  // discountPercentage comes from SQLite as string, parse to number
  const value = parseFloat(String(discount.discountPercentage)) || 0
  const displayValue = value.toFixed(1)

  return (
    <button
      type="button"
      className="flex min-h-[45px] items-center justify-between rounded-md px-3 py-2"
      style={{
        backgroundColor: discount.backColor,
        color: discount.foreColor,
      }}
      onClick={onClick}
    >
      <span className="text-sm">{discount.name}</span>
      <span className="text-sm">{displayValue}</span>
    </button>
  )
})
