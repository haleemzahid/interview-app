// Order Entry Slice - Public Exports

// Types
export * from './shared/types'

// Machine (XState)
export { OrderMachineProvider } from './shared/machines'
export {
  useOrderView,
  useCart,
  useCartTotals,
  useIsCartEmpty,
  useCartActions,
  useEditingItem,
  useEditingProduct,
  useServiceMethod,
  useInvoiceDiscount,
  useProductActions,
  useModifierActions,
  useNavigationActions,
  useSessionActions,
  useOrderActions,
} from './shared/machines'

// Hooks (data fetching)
export { useMenus } from './browse-menu/hooks/useMenus'
export { useCategories } from './browse-menu/hooks/useCategories'
export {
  useProductsByCategory,
  useProductsByMenu,
  useDirectProducts,
} from './browse-menu/hooks/useProducts'

// Components
export { OrderEntryPage } from './OrderEntryPage'
export * from './shared/components'
export * from './browse-menu/components'
export * from './cart'
export { MenuBrowseView } from './browse-menu'
