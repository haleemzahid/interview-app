// OrderEntryPage - Main order entry layout (XState powered)
// Uses CSS visibility to preserve view state and avoid re-renders

import { memo, useCallback } from 'react'
import { MenuBrowseView } from './browse-menu'
import { CartPanel } from './cart'
import { DiscountView } from './discount-view'
import { ModifierView } from './modifier-view'
import {
  useOrderView,
  useServiceMethod,
  useProductActions,
  useModifierActions,
  useNavigationActions,
  useSessionActions,
  useOrderActions,
  useSelectedCartItem,
  useCartActions,
} from './shared/machines'

// Wrapper that hides content with CSS instead of unmounting
const ViewPanel = memo(function ViewPanel({
  visible,
  children,
}: {
  visible: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`h-full w-full ${visible ? '' : 'pointer-events-none invisible absolute'}`}
      aria-hidden={!visible}
    >
      {children}
    </div>
  )
})

export function OrderEntryPage() {
  const currentView = useOrderView()
  const serviceMethod = useServiceMethod()
  const selectedCartItem = useSelectedCartItem()

  const { addProduct, editItem } = useProductActions()
  const { confirm, cancel, delete: deleteItem } = useModifierActions()
  const { goToDiscount, goToPayment, goToMenu } = useNavigationActions()
  const { setServiceMethod, setInvoiceDiscount } = useSessionActions()
  const { holdOrder, cancelOrder } = useOrderActions()
  const { setItemDiscount } = useCartActions()

  // Memoize callbacks to prevent child re-renders
  const handleDoubleClickItem = useCallback(
    (item: { id: string }) => editItem(item.id),
    [editItem]
  )

  const handleSelectDiscount = useCallback(
    (d: Parameters<typeof setInvoiceDiscount>[0]) => {
      if (selectedCartItem) {
        setItemDiscount(selectedCartItem.id, d)
      } else {
        setInvoiceDiscount(d)
      }
    },
    [selectedCartItem, setItemDiscount, setInvoiceDiscount]
  )

  const handleClearInvoiceDiscount = useCallback(
    () => setInvoiceDiscount(null),
    [setInvoiceDiscount]
  )

  const handleClearItemDiscount = useCallback(() => {
    if (selectedCartItem) {
      setItemDiscount(selectedCartItem.id, null)
    }
  }, [selectedCartItem, setItemDiscount])

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* Cart sidebar - LEFT */}
      <CartPanel
        serviceMethod={serviceMethod}
        onServiceMethodChange={setServiceMethod}
        onDoubleClickItem={handleDoubleClickItem}
        onPay={goToPayment}
        onHold={holdOrder}
        onCancel={cancelOrder}
        onDiscount={goToDiscount}
      />

      {/* Main content area - RIGHT (relative for absolute positioning) */}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {/* Menu Browse - always mounted, hidden when not active */}
        <ViewPanel visible={currentView === 'menu'}>
          <MenuBrowseView onProductSelect={addProduct} />
        </ViewPanel>

        {/* Modifier View - mounted when editing, hidden otherwise */}
        <ViewPanel visible={currentView === 'modifiers'}>
          <ModifierView
            onConfirm={confirm}
            onCancel={cancel}
            onDelete={deleteItem}
          />
        </ViewPanel>

        {/* Discount View - mounted when needed */}
        <ViewPanel visible={currentView === 'discount'}>
          <DiscountView
            onSelectDiscount={handleSelectDiscount}
            onClearInvoiceDiscount={handleClearInvoiceDiscount}
            onClearItemDiscount={handleClearItemDiscount}
            onDone={goToMenu}
            hasSelectedItem={selectedCartItem !== null}
          />
        </ViewPanel>

        {/* Payment - placeholder */}
        <ViewPanel visible={currentView === 'payment'}>
          <div className="flex h-full items-center justify-center">
            <p className="text-base-content/50">Payment view coming soon...</p>
          </div>
        </ViewPanel>
      </div>
    </div>
  )
}
