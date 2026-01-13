// Invoice & Cart Types

import type {
  Product,
  AssignedSize,
  ProductType,
  PortionType,
  Topping,
  Affix,
} from './menu'

// === Discount Types ===

/**
 * Discount type enum matching C# DiscountType
 * 0 = Other, 1 = ItemDiscount, 2 = InvoiceDiscount,
 * 3 = ProductDiscount, 4 = SubTotalDiscount, 5 = DateRangeDiscount
 */
export type DiscountType = 0 | 1 | 2 | 3 | 4 | 5

export interface Discount {
  id: string
  name: string
  displayName?: string
  discountPercentage: number // Value of discount (percentage)
  type: DiscountType
  isForWholeInvoice: boolean // true = apply to invoice, false = apply to item
  backColor: string
  foreColor: string
  orderNumber: number
}

// === Cart Types (In-Memory State) ===

export interface SpecialRequest {
  id: string
  description: string
  price: number
}

export interface CartItem {
  id: string // UUID for this cart item instance
  product: Product
  quantity: number
  size?: AssignedSize
  type?: ProductType
  portions: CartItemPortion[]
  modifiers: CartItemModifier[]
  itemDiscount?: Discount
  taxRate: number
  isTaxFree?: boolean // Item-level tax exemption (Make Tax Free action)
  specialInstructions: string[]
  specialRequests: SpecialRequest[]
  createdAt: Date
}

export interface CartItemPortion {
  id: string
  portionType: PortionType
  modifiers: CartItemModifier[]
}

export interface CartItemModifier {
  id: string
  topping: Topping
  affix?: Affix // "No", "Extra", "Light"
  quantity: number
}

export interface CartTotals {
  itemCount: number
  subTotal: number
  totalItemDiscount: number
  totalInvoiceDiscount: number
  grandTotalDiscount: number
  totalTax: number
  grandTotal: number
  totalDue: number
}

// === Invoice Types (Database Persistence) ===

export interface Invoice {
  id: string
  customerId?: string
  customerName?: string
  employeeId: string
  employeeName?: string
  serviceMethodId: string
  isTaxExempted: boolean
  isMakeToGo: boolean
  isHold: boolean
  subTotal: number
  totalDiscount: number
  totalTax: number
  grandTotal: number
  totalDue: number
  invoiceAsJsonString?: string // Serialized cart for hold invoices
  createdDate: Date
  completedDate?: Date
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  productId: string
  productName: string
  sizeName?: string
  typeName?: string
  quantity: number
  basePrice: number
  linePrice: number
  discountAmount: number
  taxAmount: number
  grandTotal: number
  orderNumber: number
}

export interface InvoiceItemModifier {
  id: string
  invoiceItemId: string
  toppingId: string
  toppingName: string
  affixName?: string
  price: number
  quantity: number
}

export interface InvoiceItemPortion {
  id: string
  invoiceItemId: string
  portionTypeId: string
  portionTypeName: string
}

export interface InvoiceTender {
  id: string
  invoiceId: string
  paymentMethodId: string
  paymentMethodName: string
  tenderAmount: number
  createdDate: Date
}

// === Payment Types ===

export interface PaymentMethod {
  id: string
  name: string
  displayName?: string
  orderNumber: number
  isActive: boolean
}

export interface ServiceMethod {
  id: string
  name: string
  displayName?: string
  orderNumber: number
}

export interface TaxRate {
  id: string
  taxGroupId: string
  serviceMethodId: string
  rate: number
}

// === Customer Types ===

export interface Customer {
  id: string
  firstName?: string
  lastName?: string
  name: string
  phone?: string
  email?: string
  isTaxExempt: boolean
}
