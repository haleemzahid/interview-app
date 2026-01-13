// Order Machine Guards

import type { OrderContext, OrderEvent } from './orderMachine.types'

export const guards = {
  cartNotEmpty: ({ context }: { context: OrderContext }) =>
    context.cart.length > 0,

  needsModifiers: ({ event }: { event: OrderEvent }) =>
    event.type === 'ADD_PRODUCT' && event.needsModifiers,

  isNewItem: ({ context }: { context: OrderContext }) => context.isNewItem,
}
