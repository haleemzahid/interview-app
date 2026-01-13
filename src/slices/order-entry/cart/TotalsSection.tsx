// TotalsSection - Displays subtotal, tax, discount, total

import { formatCurrency } from '../shared/utils'
import type { CartTotals } from '../shared/types'

interface TotalsSectionProps {
  totals: CartTotals
}

export function TotalsSection({ totals }: TotalsSectionProps) {
  return (
    <div className="border-base-300 border-t p-2 text-sm">
      <div className="flex justify-between">
        <div className="space-y-0.5">
          <div>Sub Total</div>
          <div>Total</div>
          <div>Discount:</div>
          <div>Total Tax:</div>
        </div>
        <div className="space-y-0.5 text-right">
          <div>{formatCurrency(totals.subTotal)}</div>
          <div>{formatCurrency(totals.grandTotal)}</div>
          <div>{formatCurrency(totals.grandTotalDiscount)}</div>
          <div>{formatCurrency(totals.totalTax)}</div>
        </div>
      </div>
    </div>
  )
}
