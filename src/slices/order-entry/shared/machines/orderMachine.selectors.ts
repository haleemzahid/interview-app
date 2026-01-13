// Order Machine Selectors

import type { Product, CartItem } from '../types'
import type { OrderContext } from './orderMachine.types'

export function selectEditingItem(context: OrderContext): CartItem | null {
  if (!context.editingItemId) return null
  return context.cart.find((i) => i.id === context.editingItemId) ?? null
}

export function selectEditingProduct(context: OrderContext): Product | null {
  const item = selectEditingItem(context)
  return item?.product ?? null
}

export function selectSelectedItem(context: OrderContext): CartItem | null {
  if (!context.selectedCartItemId) return null
  return context.cart.find((i) => i.id === context.selectedCartItemId) ?? null
}

export function selectCartItemCount(context: OrderContext): number {
  return context.cart.reduce((sum, item) => sum + item.quantity, 0)
}
