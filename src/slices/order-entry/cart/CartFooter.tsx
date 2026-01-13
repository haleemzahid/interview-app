// CartFooter - Bottom section with totals and action buttons

import { formatCurrency } from '../shared/utils'
import { TotalsSection } from './TotalsSection'
import type { CartTotals } from '../shared/types'

interface CartFooterProps {
  totals: CartTotals
  hasItems: boolean
  onPay: () => void
  onHold: () => void
}

export function CartFooter({
  totals,
  hasItems,
  onPay,
  onHold,
}: CartFooterProps) {
  return (
    <>
      {/* Stay/Send Buttons */}
      <div className="border-base-300 grid grid-cols-2 gap-2 border-t p-2">
        <button className="btn btn-neutral btn-sm" disabled={!hasItems}>
          Stay
        </button>
        <button className="btn btn-neutral btn-sm" disabled={!hasItems}>
          Send
        </button>
      </div>

      {/* Totals */}
      <TotalsSection totals={totals} />

      {/* Bottom Action Buttons */}
      <div className="grid grid-cols-2 gap-2 p-2">
        <button className="btn btn-outline btn-sm" onClick={onHold}>
          No Sale
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={onPay}
          disabled={!hasItems}
        >
          {formatCurrency(totals.grandTotal)}
        </button>
      </div>
    </>
  )
}
