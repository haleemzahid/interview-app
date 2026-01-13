// Order Machine Hooks - Optimized with useSelector for minimal re-renders

import { useCallback, useMemo } from 'react'
import { useOrderActorRef, useOrderSelector } from './OrderMachineProvider'
import {
  selectEditingItem,
  selectEditingProduct,
  productNeedsModifiers,
} from './orderMachine'
import { getProductWithDetails } from '../database'
import { calculateCartTotals } from '../utils/pricing'
import type {
  Product,
  CartItem,
  CartItemModifier,
  AssignedSize,
  ProductType,
  PortionType,
  Discount,
  CartTotals,
  ServiceMethod,
  SpecialRequest,
} from '../types'

// === Utility: Get send function from actor ===

function useOrderSend() {
  const actorRef = useOrderActorRef()
  return actorRef.send
}

// === View State ===

export type OrderView = 'menu' | 'modifiers' | 'discount' | 'payment'

export function useOrderView(): OrderView {
  return useOrderSelector((state) => {
    const value = state.value as string
    if (value === 'configuring') return 'modifiers'
    if (value === 'discount') return 'discount'
    if (value === 'payment') return 'payment'
    return 'menu'
  })
}

// === Cart State (optimized selectors) ===

export function useCart(): CartItem[] {
  return useOrderSelector((state) => state.context.cart)
}

export function useCartTotals(): CartTotals {
  return useOrderSelector(
    (state) =>
      calculateCartTotals(
        state.context.cart,
        state.context.isTaxExempt,
        state.context.invoiceDiscount,
        state.context.tenderAmount
      ),
    // Custom equality - only re-render if totals change
    (a, b) =>
      a.subTotal === b.subTotal &&
      a.totalTax === b.totalTax &&
      a.grandTotal === b.grandTotal &&
      a.totalDue === b.totalDue
  )
}

export function useIsCartEmpty(): boolean {
  return useOrderSelector((state) => state.context.cart.length === 0)
}

// === Editing State ===

export function useEditingItem(): CartItem | null {
  return useOrderSelector((state) => selectEditingItem(state.context))
}

export function useEditingProduct(): Product | null {
  return useOrderSelector((state) => selectEditingProduct(state.context))
}

export function useIsNewItem(): boolean {
  return useOrderSelector((state) => state.context.isNewItem)
}

// === Selected Cart Item (for discounts) ===

export function useSelectedCartItemId(): string | null {
  return useOrderSelector((state) => state.context.selectedCartItemId)
}

export function useSelectedCartItem(): CartItem | null {
  return useOrderSelector((state) => {
    const { selectedCartItemId, cart } = state.context
    if (!selectedCartItemId) return null
    return cart.find((i) => i.id === selectedCartItemId) ?? null
  })
}

export function useSelectCartItem() {
  const send = useOrderSend()
  return useCallback(
    (itemId: string | null) => send({ type: 'SELECT_CART_ITEM', itemId }),
    [send]
  )
}

// === Session State ===

export function useServiceMethod(): ServiceMethod | null {
  return useOrderSelector((state) => state.context.serviceMethod)
}

export function useInvoiceDiscount(): Discount | null {
  return useOrderSelector((state) => state.context.invoiceDiscount)
}

// === Cart Actions ===

export function useCartActions() {
  const send = useOrderSend()

  return useMemo(
    () => ({
      removeItem: (itemId: string) => send({ type: 'REMOVE_ITEM', itemId }),
      setItemDiscount: (itemId: string, discount: Discount | null) =>
        send({ type: 'SET_ITEM_DISCOUNT', itemId, discount }),
    }),
    [send]
  )
}

// === Product Actions ===

export function useProductActions() {
  const send = useOrderSend()

  const addProduct = useCallback(
    async (product: Product) => {
      // Load full product details
      const details = await getProductWithDetails(product.id)
      const fullProduct: Product = {
        ...product,
        assignedSizes: details.assignedSizes,
        productTypes: details.productTypes,
        portionTypes: details.portionTypes,
        toppingCategories: details.toppingCategories,
      }

      send({
        type: 'ADD_PRODUCT',
        product: fullProduct,
        needsModifiers: productNeedsModifiers(fullProduct),
      })
    },
    [send]
  )

  const editItem = useCallback(
    (itemId: string) => {
      send({ type: 'EDIT_ITEM', itemId })
    },
    [send]
  )

  return { addProduct, editItem }
}

// === Modifier Actions (live updates) ===

export function useModifierActions() {
  const send = useOrderSend()

  return useMemo(
    () => ({
      setSize: (size: AssignedSize | null) => send({ type: 'SET_SIZE', size }),
      setType: (productType: ProductType | null) =>
        send({ type: 'SET_TYPE', productType }),
      setPortions: (portions: PortionType[]) =>
        send({ type: 'SET_PORTIONS', portions }),
      setModifiers: (modifiers: CartItemModifier[]) =>
        send({ type: 'SET_MODIFIERS', modifiers }),
      setQuantity: (quantity: number) =>
        send({ type: 'SET_QUANTITY', quantity }),
      addSpecialRequest: (request: SpecialRequest) =>
        send({ type: 'ADD_SPECIAL_REQUEST', request }),
      removeSpecialRequest: (requestId: string) =>
        send({ type: 'REMOVE_SPECIAL_REQUEST', requestId }),
      confirm: () => send({ type: 'CONFIRM_ITEM' }),
      cancel: () => send({ type: 'CANCEL_ITEM' }),
      delete: () => send({ type: 'DELETE_ITEM' }),
    }),
    [send]
  )
}

// === Navigation Actions ===

export function useNavigationActions() {
  const send = useOrderSend()
  const isCartEmpty = useIsCartEmpty()
  const isConfiguring = useOrderSelector(
    (state) => state.value === 'configuring'
  )

  return useMemo(
    () => ({
      goToMenu: () => send({ type: 'GO_TO_MENU' }),
      goToDiscount: () => send({ type: 'GO_TO_DISCOUNT' }),
      goToPayment: () => {
        if (!isCartEmpty) send({ type: 'GO_TO_PAYMENT' })
      },
      canGoToPayment: !isCartEmpty && !isConfiguring,
    }),
    [send, isCartEmpty, isConfiguring]
  )
}

// === Session Actions ===

export function useSessionActions() {
  const send = useOrderSend()

  return useMemo(
    () => ({
      setServiceMethod: (method: ServiceMethod | null) =>
        send({ type: 'SET_SERVICE_METHOD', method }),
      setInvoiceDiscount: (discount: Discount | null) =>
        send({ type: 'SET_INVOICE_DISCOUNT', discount }),
      setTaxExempt: (exempt: boolean) =>
        send({ type: 'SET_TAX_EXEMPT', exempt }),
    }),
    [send]
  )
}

// === Order Actions ===

export function useOrderActions() {
  const send = useOrderSend()

  return useMemo(
    () => ({
      holdOrder: () => send({ type: 'HOLD_ORDER' }),
      cancelOrder: () => {
        if (confirm('Cancel this order?')) {
          send({ type: 'CANCEL_ORDER' })
        }
      },
      completePayment: (amount: number) =>
        send({ type: 'COMPLETE_PAYMENT', amount }),
      resetOrder: () => send({ type: 'RESET_ORDER' }),
    }),
    [send]
  )
}
