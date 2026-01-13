// Menu & Product Types

/** Base entity with common properties */
export interface BaseEntity {
  id: string
  name: string
  displayName?: string
  orderNumber: number
}

/** Base entity with color properties */
export interface ColoredEntity extends BaseEntity {
  backColor: string
  foreColor: string
}

export interface Menu extends ColoredEntity {
  isNoMenu: boolean
}

export interface MenuCategory extends ColoredEntity {
  menuId: string
}

export interface Product extends ColoredEntity {
  menuCategoryId?: string
  menuId?: string
  basePrice: number
  isTaxed: boolean
  taxGroupId?: string
  allowSpecialRequest: boolean
  // Loaded relations
  assignedSizes?: AssignedSize[]
  productTypes?: ProductType[]
  portionTypes?: PortionType[]
  toppingCategories?: ToppingCategory[]
}

export type Size = BaseEntity

export interface AssignedSize {
  id: string
  productId: string
  sizeId: string
  price: number
  isAssigned: boolean
  orderNumber: number
  size?: Size
}

export interface ProductType extends BaseEntity {
  productId: string
  price: number
}

export interface PortionType extends BaseEntity {
  productId: string
  price: number
}

export interface ToppingCategory extends BaseEntity {
  productId: string
  isMandatory: boolean
  canAddMultiple: boolean
  toppings?: Topping[]
}

export interface Topping extends BaseEntity {
  toppingCategoryId: string
  price: number
  backColor?: string
  foreColor?: string
}

export interface Affix extends BaseEntity {
  isPrefix: boolean
  priceModifier: number // e.g., 0 for "No", 1.5 for "Extra"
}
