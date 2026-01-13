// Order Machine Types

import type {
  Product,
  CartItem,
  CartItemModifier,
  ServiceMethod,
  Customer,
  Discount,
  AssignedSize,
  ProductType,
  PortionType,
  SpecialRequest,
} from '../types'

// === Context ===

export interface OrderContext {
  // Cart
  cart: CartItem[]
  selectedCartItemId: string | null // for item discounts (single-click selection)
  editingItemId: string | null
  isNewItem: boolean // true = cancel removes item, false = cancel reverts to original
  originalItem: CartItem | null // snapshot before editing (for revert)

  // Session
  serviceMethod: ServiceMethod | null
  customer: Customer | null
  invoiceDiscount: Discount | null
  isTaxExempt: boolean

  // Payment
  tenderAmount: number
}

export const initialContext: OrderContext = {
  cart: [],
  selectedCartItemId: null,
  editingItemId: null,
  isNewItem: false,
  originalItem: null,
  serviceMethod: null,
  customer: null,
  invoiceDiscount: null,
  isTaxExempt: false,
  tenderAmount: 0,
}

// === Events ===

export type OrderEvent =
  // Product actions
  | { type: 'ADD_PRODUCT'; product: Product; needsModifiers: boolean }
  | { type: 'EDIT_ITEM'; itemId: string }
  // Modifier actions (live updates)
  | { type: 'SET_SIZE'; size: AssignedSize | null }
  | { type: 'SET_TYPE'; productType: ProductType | null }
  | { type: 'SET_PORTIONS'; portions: PortionType[] }
  | { type: 'SET_MODIFIERS'; modifiers: CartItemModifier[] }
  | { type: 'SET_QUANTITY'; quantity: number }
  | { type: 'ADD_SPECIAL_REQUEST'; request: SpecialRequest }
  | { type: 'REMOVE_SPECIAL_REQUEST'; requestId: string }
  // Modifier flow control
  | { type: 'CONFIRM_ITEM' }
  | { type: 'CANCEL_ITEM' }
  | { type: 'DELETE_ITEM' }
  // Cart actions
  | { type: 'SELECT_CART_ITEM'; itemId: string | null }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'SET_ITEM_DISCOUNT'; itemId: string; discount: Discount | null }
  | { type: 'DUPLICATE_ITEM'; itemId: string }
  | { type: 'SET_ITEM_TAX_FREE'; itemId: string; isTaxFree: boolean }
  | { type: 'SET_ITEM_QUANTITY'; itemId: string; quantity: number }
  // Session actions
  | { type: 'SET_SERVICE_METHOD'; method: ServiceMethod | null }
  | { type: 'SET_CUSTOMER'; customer: Customer | null }
  | { type: 'SET_INVOICE_DISCOUNT'; discount: Discount | null }
  | { type: 'SET_TAX_EXEMPT'; exempt: boolean }
  // Navigation
  | { type: 'GO_TO_DISCOUNT' }
  | { type: 'GO_TO_PAYMENT' }
  | { type: 'GO_TO_MENU' }
  // Order actions
  | { type: 'HOLD_ORDER' }
  | { type: 'CANCEL_ORDER' }
  | { type: 'COMPLETE_PAYMENT'; amount: number }
  | { type: 'RESET_ORDER' }
