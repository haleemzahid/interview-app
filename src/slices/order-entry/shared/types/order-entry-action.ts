// Order Entry Action Types

export type ActionScope = 'Invoice' | 'Item' | 'None'

export type ActionType =
  | 'TaxExempt'
  | 'MakeTaxFree'
  | 'DuplicateItem'
  | 'MakeToGo'
  | 'RemoveItem'
  | 'DuplicateTicket'
  | 'Hold'
  | 'CancelOrder'
  | 'ClearInvoiceDiscount'
  | 'ClearItemDiscount'
  | 'ManagerActions'
  | 'HoldOrders'
  | 'DecreaseQuantity'
  | 'IncreaseQuantity'
  | 'ManagerReprint'

export interface OrderEntryAction {
  id: string
  type: ActionType
  label: string
  scope: ActionScope
  altLabel?: string | null
  altBackColor?: string | null
  altForeColor?: string | null
  isManagerOverrideRequired: boolean
  foreColor: string
  backColor: string
  orderNumber: number
}
