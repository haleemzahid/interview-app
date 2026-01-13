// Order State Machine - XState 5
// Handles order flow: browsing → configuring → discount → payment → complete

import { setup } from 'xstate'
import type { OrderContext, OrderEvent } from './orderMachine.types'
import { initialContext } from './orderMachine.types'
import { guards } from './orderMachine.guards'
import * as importedActions from './orderMachine.actions'

// Re-export types and utilities for convenience
export type { OrderContext, OrderEvent } from './orderMachine.types'
export { initialContext } from './orderMachine.types'
export { productNeedsModifiers } from './orderMachine.helpers'
export * from './orderMachine.selectors'

// === Machine ===

export const orderMachine = setup({
  types: {
    context: {} as OrderContext,
    events: {} as OrderEvent,
  },
  guards,
  actions: importedActions as unknown as Record<
    keyof typeof importedActions,
    (args: { context: OrderContext; event: OrderEvent }) => void
  >,
}).createMachine({
  id: 'order',
  initial: 'browsing',
  context: initialContext,

  states: {
    // Main menu browsing state
    browsing: {
      on: {
        ADD_PRODUCT: [
          {
            // Product needs modifiers: add to cart, then go to configuring
            guard: 'needsModifiers',
            target: 'configuring',
            actions: ['addProductToCart', 'startConfiguringNew'],
          },
          {
            // Simple product: just add to cart, stay in browsing
            actions: 'addProductToCart',
          },
        ],
        EDIT_ITEM: {
          target: 'configuring',
          actions: 'startEditingExisting',
        },
        REMOVE_ITEM: {
          actions: 'removeItem',
        },
        SELECT_CART_ITEM: {
          actions: 'selectCartItem',
        },
        SET_ITEM_DISCOUNT: {
          actions: 'setItemDiscount',
        },
        DUPLICATE_ITEM: {
          actions: 'duplicateItem',
        },
        SET_ITEM_TAX_FREE: {
          actions: 'setItemTaxFree',
        },
        SET_ITEM_QUANTITY: {
          actions: 'setItemQuantity',
        },
        GO_TO_DISCOUNT: 'discount',
        GO_TO_PAYMENT: {
          target: 'payment',
          guard: 'cartNotEmpty',
        },
        // Session actions available in browsing
        SET_SERVICE_METHOD: { actions: 'setServiceMethod' },
        SET_CUSTOMER: { actions: 'setCustomer' },
        SET_TAX_EXEMPT: { actions: 'setTaxExempt' },
        CANCEL_ORDER: { actions: 'clearCart' },
        HOLD_ORDER: 'holding',
      },
    },

    // Configuring product (size, type, portions, modifiers)
    configuring: {
      on: {
        // Live updates
        SET_SIZE: { actions: 'updateSize' },
        SET_TYPE: { actions: 'updateType' },
        SET_PORTIONS: { actions: 'updatePortions' },
        SET_MODIFIERS: { actions: 'updateModifiers' },
        SET_QUANTITY: { actions: 'updateQuantity' },
        ADD_SPECIAL_REQUEST: { actions: 'addSpecialRequest' },
        REMOVE_SPECIAL_REQUEST: { actions: 'removeSpecialRequest' },

        // Flow control
        CONFIRM_ITEM: {
          target: 'browsing',
          actions: 'confirmItem',
        },
        CANCEL_ITEM: [
          {
            guard: 'isNewItem',
            target: 'browsing',
            actions: 'cancelNewItem',
          },
          {
            target: 'browsing',
            actions: 'cancelEditItem',
          },
        ],
        DELETE_ITEM: {
          target: 'browsing',
          actions: 'deleteEditingItem',
        },
      },
    },

    // Discount selection
    discount: {
      on: {
        SELECT_CART_ITEM: { actions: 'selectCartItem' },
        SET_INVOICE_DISCOUNT: { actions: 'setInvoiceDiscount' },
        SET_ITEM_DISCOUNT: { actions: 'setItemDiscount' },
        GO_TO_MENU: 'browsing',
      },
    },

    // Payment processing
    payment: {
      on: {
        COMPLETE_PAYMENT: {
          target: 'complete',
          actions: 'completePayment',
        },
        GO_TO_MENU: 'browsing',
      },
    },

    // Hold order (save for later)
    holding: {
      // TODO: Persist to database, then reset
      always: {
        target: 'browsing',
        actions: 'resetOrder',
      },
    },

    // Order complete
    complete: {
      type: 'final',
      entry: 'resetOrder',
    },
  },
})
