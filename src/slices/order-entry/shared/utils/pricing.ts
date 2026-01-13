// Price Calculation Utilities
// Pure functions for calculating item and invoice totals

import type { CartItem, CartItemModifier, CartTotals } from '../types'

/**
 * Calculate modifier price (with affix adjustment)
 */
export function calculateModifierPrice(modifier: CartItemModifier): number {
  const basePrice = modifier.topping.price
  const affixMultiplier = modifier.affix?.priceModifier ?? 1
  // "No" affix typically has priceModifier = 0
  // "Extra" might have priceModifier = 1.5 or 2
  // Regular has priceModifier = 1
  return basePrice * affixMultiplier * modifier.quantity
}

/**
 * Calculate item base price (size price or product base price)
 */
export function calculateItemBasePrice(item: CartItem): number {
  return item.size?.price ?? item.product.basePrice
}

/**
 * Calculate total modifiers price for an item
 */
export function calculateModifiersTotal(item: CartItem): number {
  // Item-level modifiers
  const itemModifiersTotal = item.modifiers.reduce(
    (sum, m) => sum + calculateModifierPrice(m),
    0
  )

  // Portion-level modifiers
  const portionModifiersTotal = item.portions.reduce(
    (sum, portion) =>
      sum +
      portion.modifiers.reduce((s, m) => s + calculateModifierPrice(m), 0),
    0
  )

  return itemModifiersTotal + portionModifiersTotal
}

/**
 * Calculate item line price (before discounts and tax)
 * Formula: (BasePrice × Quantity) + ModifiersTotal + SpecialRequestsTotal
 */
export function calculateItemLinePrice(item: CartItem): number {
  const basePrice = calculateItemBasePrice(item)
  const modifiersTotal = calculateModifiersTotal(item)
  const specialRequestsTotal = (item.specialRequests ?? []).reduce(
    (sum, req) => sum + (req.price ?? 0),
    0
  )
  return basePrice * item.quantity + modifiersTotal + specialRequestsTotal
}

/**
 * Calculate item-level discount
 * Formula: (LinePrice / 100) × DiscountPercentage
 */
export function calculateItemDiscount(item: CartItem): number {
  if (!item.itemDiscount) return 0

  const linePrice = calculateItemLinePrice(item)
  // discountPercentage comes from SQLite as TEXT, parse to number
  const discountPct =
    parseFloat(String(item.itemDiscount.discountPercentage)) || 0
  return (linePrice / 100) * discountPct
}

/**
 * Calculate item tax
 * Formula: (LinePrice - Discount) × TaxRate
 * Note: taxRate is stored as decimal (0.0825 = 8.25%)
 */
export function calculateItemTax(item: CartItem, isTaxExempt: boolean): number {
  // Skip tax if invoice is tax exempt, item is tax-free, or product is not taxed
  if (isTaxExempt || item.isTaxFree || !item.product.isTaxed) return 0

  const linePrice = calculateItemLinePrice(item)
  const discount = calculateItemDiscount(item)
  const taxableAmount = linePrice - discount

  return taxableAmount * item.taxRate
}

/**
 * Calculate item grand total
 * Formula: LinePrice - Discount + Tax
 */
export function calculateItemGrandTotal(
  item: CartItem,
  isTaxExempt: boolean
): number {
  const linePrice = calculateItemLinePrice(item)
  const discount = calculateItemDiscount(item)
  const tax = calculateItemTax(item, isTaxExempt)

  return linePrice - discount + tax
}

/**
 * Calculate invoice-level discount (applied proportionally to all items)
 */
export function calculateInvoiceDiscount(
  items: CartItem[],
  invoiceDiscount: { discountPercentage: number } | null
): number {
  if (!invoiceDiscount) return 0

  const subTotal = items.reduce(
    (sum, item) => sum + calculateItemLinePrice(item),
    0
  )
  const itemDiscounts = items.reduce(
    (sum, item) => sum + calculateItemDiscount(item),
    0
  )
  const afterItemDiscounts = subTotal - itemDiscounts

  // discountPercentage comes from SQLite as TEXT, parse to number
  const discountPct =
    parseFloat(String(invoiceDiscount.discountPercentage)) || 0
  return (afterItemDiscounts / 100) * discountPct
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(
  items: CartItem[],
  isTaxExempt: boolean,
  invoiceDiscount: { discountPercentage: number } | null = null,
  tenderAmount = 0
): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subTotal = items.reduce(
    (sum, item) => sum + calculateItemLinePrice(item),
    0
  )
  const totalItemDiscount = items.reduce(
    (sum, item) => sum + calculateItemDiscount(item),
    0
  )
  const totalInvoiceDiscount = calculateInvoiceDiscount(items, invoiceDiscount)
  const grandTotalDiscount = totalItemDiscount + totalInvoiceDiscount
  const totalTax = items.reduce(
    (sum, item) => sum + calculateItemTax(item, isTaxExempt),
    0
  )
  const grandTotal = subTotal - grandTotalDiscount + totalTax
  const totalDue = Math.max(0, grandTotal - tenderAmount)

  return {
    itemCount,
    subTotal,
    totalItemDiscount,
    totalInvoiceDiscount,
    grandTotalDiscount,
    totalTax,
    grandTotal,
    totalDue,
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `$${(num || 0).toFixed(2)}`
}
