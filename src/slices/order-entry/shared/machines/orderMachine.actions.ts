// Order Machine Actions

import { assign } from 'xstate'
import type { CartItem } from '../types'
import type { OrderContext, OrderEvent } from './orderMachine.types'
import { initialContext } from './orderMachine.types'
import { createCartItem } from './orderMachine.helpers'

// === Product Actions ===

export const addProductToCart = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'ADD_PRODUCT') return context.cart
    const newItem = createCartItem(event.product)
    return [...context.cart, newItem]
  },
  editingItemId: ({
    context,
    event,
  }: {
    context: OrderContext
    event: OrderEvent
  }) => {
    if (event.type !== 'ADD_PRODUCT') return context.editingItemId
    return null // Will be set by startConfiguringNew if needed
  },
})

export const startConfiguringNew = assign(
  ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'ADD_PRODUCT') return context
    const newItem = context.cart[context.cart.length - 1]
    return {
      ...context,
      editingItemId: newItem.id,
      isNewItem: true,
      originalItem: null,
    }
  }
)

export const startEditingExisting = assign(
  ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'EDIT_ITEM') return context
    const item = context.cart.find((i) => i.id === event.itemId)
    if (!item) return context
    return {
      ...context,
      editingItemId: event.itemId,
      isNewItem: false,
      originalItem: structuredClone(item),
    }
  }
)

// === Live Update Actions ===

export const updateSize = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'SET_SIZE' || !context.editingItemId) return context.cart
    return context.cart.map((item) =>
      item.id === context.editingItemId
        ? { ...item, size: event.size ?? undefined }
        : item
    )
  },
})

export const updateType = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'SET_TYPE' || !context.editingItemId) return context.cart
    return context.cart.map((item) =>
      item.id === context.editingItemId
        ? { ...item, type: event.productType ?? undefined }
        : item
    )
  },
})

export const updatePortions = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'SET_PORTIONS' || !context.editingItemId)
      return context.cart
    return context.cart.map((item) =>
      item.id === context.editingItemId
        ? {
            ...item,
            portions: event.portions.map((p) => ({
              id: crypto.randomUUID(),
              portionType: p,
              modifiers: [],
            })),
          }
        : item
    )
  },
})

export const updateModifiers = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'SET_MODIFIERS' || !context.editingItemId)
      return context.cart
    return context.cart.map((item) =>
      item.id === context.editingItemId
        ? { ...item, modifiers: event.modifiers }
        : item
    )
  },
})

export const updateQuantity = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'SET_QUANTITY' || !context.editingItemId)
      return context.cart
    return context.cart.map((item) =>
      item.id === context.editingItemId
        ? { ...item, quantity: Math.max(1, event.quantity) }
        : item
    )
  },
})

export const addSpecialRequest = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'ADD_SPECIAL_REQUEST' || !context.editingItemId)
      return context.cart
    return context.cart.map((item) =>
      item.id === context.editingItemId
        ? { ...item, specialRequests: [...item.specialRequests, event.request] }
        : item
    )
  },
})

export const removeSpecialRequest = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'REMOVE_SPECIAL_REQUEST' || !context.editingItemId)
      return context.cart
    return context.cart.map((item) =>
      item.id === context.editingItemId
        ? {
            ...item,
            specialRequests: item.specialRequests.filter(
              (r) => r.id !== event.requestId
            ),
          }
        : item
    )
  },
})

// === Item Flow Control Actions ===

export const confirmItem = assign({
  editingItemId: null as string | null,
  isNewItem: false,
  originalItem: null as CartItem | null,
})

export const cancelNewItem = assign(
  ({ context }: { context: OrderContext }) => ({
    cart: context.cart.filter((i) => i.id !== context.editingItemId),
    editingItemId: null,
    isNewItem: false,
    originalItem: null,
  })
)

export const cancelEditItem = assign(
  ({ context }: { context: OrderContext }) => {
    if (!context.originalItem) {
      return {
        ...context,
        editingItemId: null,
        isNewItem: false,
        originalItem: null,
      }
    }
    return {
      cart: context.cart.map((item) =>
        item.id === context.editingItemId && context.originalItem
          ? context.originalItem
          : item
      ),
      editingItemId: null,
      isNewItem: false,
      originalItem: null,
    }
  }
)

export const deleteEditingItem = assign(
  ({ context }: { context: OrderContext }) => ({
    cart: context.cart.filter((i) => i.id !== context.editingItemId),
    editingItemId: null,
    isNewItem: false,
    originalItem: null,
  })
)

// === Cart Actions ===

export const removeItem = assign(
  ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'REMOVE_ITEM') return context
    return {
      cart: context.cart.filter((i) => i.id !== event.itemId),
      selectedCartItemId:
        context.selectedCartItemId === event.itemId
          ? null
          : context.selectedCartItemId,
    }
  }
)

export const selectCartItem = assign({
  selectedCartItemId: ({
    context,
    event,
  }: {
    context: OrderContext
    event: OrderEvent
  }) => {
    if (event.type !== 'SELECT_CART_ITEM') return context.selectedCartItemId
    return context.selectedCartItemId === event.itemId ? null : event.itemId
  },
})

export const setItemDiscount = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'SET_ITEM_DISCOUNT') return context.cart
    return context.cart.map((item) =>
      item.id === event.itemId
        ? { ...item, itemDiscount: event.discount ?? undefined }
        : item
    )
  },
})

export const duplicateItem = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'DUPLICATE_ITEM') return context.cart
    const item = context.cart.find((i) => i.id === event.itemId)
    if (!item) return context.cart
    const duplicate: CartItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    return [...context.cart, duplicate]
  },
})

export const setItemTaxFree = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'SET_ITEM_TAX_FREE') return context.cart
    return context.cart.map((item) =>
      item.id === event.itemId ? { ...item, isTaxFree: event.isTaxFree } : item
    )
  },
})

export const setItemQuantity = assign({
  cart: ({ context, event }: { context: OrderContext; event: OrderEvent }) => {
    if (event.type !== 'SET_ITEM_QUANTITY') return context.cart
    return context.cart.map((item) =>
      item.id === event.itemId
        ? { ...item, quantity: Math.max(1, event.quantity) }
        : item
    )
  },
})

// === Session Actions ===

export const setServiceMethod = assign({
  serviceMethod: ({ event }: { event: OrderEvent }) =>
    event.type === 'SET_SERVICE_METHOD' ? event.method : null,
})

export const setCustomer = assign({
  customer: ({ event }: { event: OrderEvent }) =>
    event.type === 'SET_CUSTOMER' ? event.customer : null,
})

export const setInvoiceDiscount = assign({
  invoiceDiscount: ({ event }: { event: OrderEvent }) =>
    event.type === 'SET_INVOICE_DISCOUNT' ? event.discount : null,
})

export const setTaxExempt = assign({
  isTaxExempt: ({ event }: { event: OrderEvent }) =>
    event.type === 'SET_TAX_EXEMPT' ? event.exempt : false,
})

// === Order Actions ===

export const resetOrder = assign(() => initialContext)

export const clearCart = assign({ cart: [] as CartItem[] })

export const completePayment = assign({
  tenderAmount: ({ event }: { event: OrderEvent }) =>
    event.type === 'COMPLETE_PAYMENT' ? event.amount : 0,
})

// === Export all actions as object for machine setup ===

export const actions = {
  addProductToCart,
  startConfiguringNew,
  startEditingExisting,
  updateSize,
  updateType,
  updatePortions,
  updateModifiers,
  updateQuantity,
  addSpecialRequest,
  removeSpecialRequest,
  confirmItem,
  cancelNewItem,
  cancelEditItem,
  deleteEditingItem,
  removeItem,
  selectCartItem,
  setItemDiscount,
  duplicateItem,
  setItemTaxFree,
  setItemQuantity,
  setServiceMethod,
  setCustomer,
  setInvoiceDiscount,
  setTaxExempt,
  resetOrder,
  clearCart,
  completePayment,
}
