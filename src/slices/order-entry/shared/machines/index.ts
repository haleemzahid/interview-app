// Order Machine - Re-exports

export {
  orderMachine,
  selectEditingItem,
  selectEditingProduct,
  productNeedsModifiers,
} from './orderMachine'
export type { OrderContext, OrderEvent } from './orderMachine'

export {
  OrderMachineProvider,
  useOrderActorRef,
  useOrderSelector,
} from './OrderMachineProvider'

export {
  // View
  useOrderView,
  type OrderView,
  // Cart
  useCart,
  useCartTotals,
  useIsCartEmpty,
  useCartActions,
  // Editing
  useEditingItem,
  useEditingProduct,
  useIsNewItem,
  // Selected Cart Item
  useSelectedCartItemId,
  useSelectedCartItem,
  useSelectCartItem,
  // Session
  useServiceMethod,
  useInvoiceDiscount,
  useSessionActions,
  // Product
  useProductActions,
  // Modifiers
  useModifierActions,
  // Navigation
  useNavigationActions,
  // Order
  useOrderActions,
} from './useOrderMachine'
