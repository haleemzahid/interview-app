// Order Machine Helpers

import type { Product, CartItem } from '../types'

export function createCartItem(product: Product): CartItem {
  return {
    id: crypto.randomUUID(),
    product,
    quantity: 1,
    portions: [],
    modifiers: [],
    taxRate: product.isTaxed ? 0.0825 : 0,
    specialInstructions: [],
    specialRequests: [],
    createdAt: new Date(),
  }
}

export function productNeedsModifiers(product: Product): boolean {
  const hasSizes = (product.assignedSizes?.length ?? 0) > 0
  const hasTypes = (product.productTypes?.length ?? 0) > 0
  const hasPortions = (product.portionTypes?.length ?? 0) > 0
  const hasModifiers = (product.toppingCategories?.length ?? 0) > 0
  return hasSizes || hasTypes || hasPortions || hasModifiers
}
