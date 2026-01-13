// Action Handlers - Centralized logic for order entry action buttons

import { useCallback, useState } from 'react'
import {
  useOrderActorRef,
  useOrderSelector,
} from '../machines/OrderMachineProvider'
import {
  useSelectedCartItem,
  useCartActions,
  useSessionActions,
} from '../machines'
import type { ActionType } from '../types/order-entry-action'
import type { CartItem } from '../types'

export function useActionHandlers() {
  const actorRef = useOrderActorRef()
  const send = actorRef.send
  const isTaxExempt = useOrderSelector((s) => s.context.isTaxExempt)

  const selectedItem = useSelectedCartItem()
  const { removeItem, setItemDiscount } = useCartActions()
  const { setInvoiceDiscount, setTaxExempt } = useSessionActions()

  // Confirmation dialog state for CancelOrder
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const duplicateItem = useCallback(
    (item: CartItem) => {
      send({ type: 'DUPLICATE_ITEM', itemId: item.id })
    },
    [send]
  )

  const handleAction = useCallback(
    (actionType: ActionType) => {
      switch (actionType) {
        case 'TaxExempt':
          setTaxExempt(!isTaxExempt)
          break
        case 'MakeTaxFree':
          if (selectedItem) {
            send({
              type: 'SET_ITEM_TAX_FREE',
              itemId: selectedItem.id,
              isTaxFree: !selectedItem.isTaxFree,
            })
          }
          break
        case 'DuplicateItem':
          if (selectedItem) {
            duplicateItem(selectedItem)
          }
          break
        case 'RemoveItem':
          if (selectedItem) {
            removeItem(selectedItem.id)
            send({ type: 'SELECT_CART_ITEM', itemId: null })
          }
          break
        case 'IncreaseQuantity':
          if (selectedItem) {
            send({
              type: 'SET_ITEM_QUANTITY',
              itemId: selectedItem.id,
              quantity: selectedItem.quantity + 1,
            })
          }
          break
        case 'DecreaseQuantity':
          if (selectedItem) {
            if (selectedItem.quantity <= 1) {
              removeItem(selectedItem.id)
              send({ type: 'SELECT_CART_ITEM', itemId: null })
            } else {
              send({
                type: 'SET_ITEM_QUANTITY',
                itemId: selectedItem.id,
                quantity: selectedItem.quantity - 1,
              })
            }
          }
          break
        case 'ClearInvoiceDiscount':
          setInvoiceDiscount(null)
          break
        case 'ClearItemDiscount':
          if (selectedItem) {
            setItemDiscount(selectedItem.id, null)
          }
          break
        case 'CancelOrder':
          // Show confirmation dialog - actual cancel handled by confirmCancelOrder
          setShowCancelConfirm(true)
          break
        default:
          console.warn(`Action not implemented: ${actionType}`)
      }
    },
    [
      isTaxExempt,
      setTaxExempt,
      selectedItem,
      setItemDiscount,
      setInvoiceDiscount,
      duplicateItem,
      removeItem,
      send,
    ]
  )

  // Cancel order confirmation handlers
  const confirmCancelOrder = useCallback(() => {
    send({ type: 'CANCEL_ORDER' })
    setShowCancelConfirm(false)
  }, [send])

  const dismissCancelOrder = useCallback(() => {
    setShowCancelConfirm(false)
  }, [])

  const isActionActive = useCallback(
    (actionType: ActionType): boolean => {
      switch (actionType) {
        case 'TaxExempt':
          return isTaxExempt
        case 'MakeTaxFree':
          return selectedItem?.isTaxFree ?? false
        default:
          return false
      }
    },
    [isTaxExempt, selectedItem]
  )

  return {
    handleAction,
    isActionActive,
    // Cancel order dialog state and handlers
    showCancelConfirm,
    confirmCancelOrder,
    dismissCancelOrder,
  }
}
