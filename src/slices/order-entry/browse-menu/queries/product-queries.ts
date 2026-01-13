// Product Detail Queries (Sizes, Types, Portions, Toppings)

import { getDatabase } from '@/core/database/client'
import type {
  AssignedSize,
  ProductType,
  PortionType,
  ToppingCategory,
  Topping,
  Affix,
} from '../../shared/types'

/**
 * Get assigned sizes for a product
 */
export async function getAssignedSizesByProductId(
  productId: string
): Promise<AssignedSize[]> {
  const db = await getDatabase()

  interface FlatAssignedSize {
    id: string
    productId: string
    sizeId: string
    price: number
    isAssigned: boolean
    orderNumber: number
    sizeObjId: string
    sizeName: string
    sizeDisplayName: string
    sizeOrderNumber: number
  }

  const rows = await db.select<FlatAssignedSize[]>(
    `
    SELECT 
      a.Id as id,
      a.ProductId as productId,
      a.SizeId as sizeId,
      a.Price as price,
      a.IsAssigned as isAssigned,
      0 as orderNumber,
      s.Id as sizeObjId,
      s.Name as sizeName,
      s.DisplayName as sizeDisplayName,
      s.OrderNumber as sizeOrderNumber
    FROM AssingedSizes a
    LEFT JOIN Sizes s ON a.SizeId = s.Id
    WHERE a.ProductId = $1 AND a.IsAssigned = 1
    ORDER BY s.OrderNumber
  `,
    [productId]
  )

  // Transform flat rows into nested objects
  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    sizeId: row.sizeId,
    price: Number(row.price) || 0,
    isAssigned: Boolean(row.isAssigned),
    orderNumber: row.orderNumber,
    size: {
      id: row.sizeObjId,
      name: row.sizeName,
      displayName: row.sizeDisplayName,
      orderNumber: row.sizeOrderNumber,
    },
  }))
}

/**
 * Get product types for a product
 */
export async function getProductTypesByProductId(
  productId: string
): Promise<ProductType[]> {
  const db = await getDatabase()
  return db.select<ProductType[]>(
    `
    SELECT 
      Id as id,
      ProductId as productId,
      Name as name,
      DisplayName as displayName,
      0 as price,
      OrderNumber as orderNumber
    FROM ProductTypes 
    WHERE ProductId = $1
    ORDER BY OrderNumber
  `,
    [productId]
  )
}

/**
 * Get portion types for a product
 */
export async function getPortionTypesByProductId(
  productId: string
): Promise<PortionType[]> {
  const db = await getDatabase()
  return db.select<PortionType[]>(
    `
    SELECT 
      Id as id,
      ProductId as productId,
      Name as name,
      DisplayName as displayName,
      0 as price,
      OrderNumber as orderNumber
    FROM PortionTypes 
    WHERE ProductId = $1
    ORDER BY OrderNumber
  `,
    [productId]
  )
}

/**
 * Get topping categories for a product
 */
export async function getToppingCategoriesByProductId(
  productId: string
): Promise<ToppingCategory[]> {
  const db = await getDatabase()
  return db.select<ToppingCategory[]>(
    `
    SELECT 
      Id as id,
      ProductId as productId,
      Name as name,
      DisplayName as displayName,
      IsMandatory as isMandatory,
      CanAddMultiple as canAddMultiple,
      OrderNumber as orderNumber
    FROM ToppingCategories 
    WHERE ProductId = $1
    ORDER BY IsMandatory DESC, OrderNumber
  `,
    [productId]
  )
}

/**
 * Get toppings for a topping category
 */
export async function getToppingsByCategoryId(
  toppingCategoryId: string
): Promise<Topping[]> {
  const db = await getDatabase()
  return db.select<Topping[]>(
    `
    SELECT 
      Id as id,
      ToppingCategoryId as toppingCategoryId,
      Name as name,
      DisplayName as displayName,
      Price as price,
      BackColor as backColor,
      ForeColor as foreColor,
      OrderNumber as orderNumber
    FROM Toppings 
    WHERE ToppingCategoryId = $1
    ORDER BY OrderNumber
  `,
    [toppingCategoryId]
  )
}

/**
 * Get all toppings for a product (via topping categories)
 */
export async function getToppingsByProductId(
  productId: string
): Promise<ToppingCategory[]> {
  // Get categories first
  const categories = await getToppingCategoriesByProductId(productId)

  // Load toppings for each category
  const categoriesWithToppings = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      toppings: await getToppingsByCategoryId(category.id),
    }))
  )

  return categoriesWithToppings
}

/**
 * Get all affixes
 */
export async function getAffixes(): Promise<Affix[]> {
  const db = await getDatabase()
  return db.select<Affix[]>(`
    SELECT 
      Id as id,
      Name as name,
      DisplayName as displayName,
      IsPrefix as isPrefix,
      PriceModifier as priceModifier,
      OrderNumber as orderNumber
    FROM Affixes 
    WHERE IsDeleted = 0
    ORDER BY OrderNumber
  `)
}

/**
 * Load full product details (sizes, types, portions, toppings)
 */
export async function getProductWithDetails(productId: string) {
  const [assignedSizes, productTypes, portionTypes, toppingCategories] =
    await Promise.all([
      getAssignedSizesByProductId(productId),
      getProductTypesByProductId(productId),
      getPortionTypesByProductId(productId),
      getToppingsByProductId(productId),
    ])

  return {
    assignedSizes,
    productTypes,
    portionTypes,
    toppingCategories,
  }
}
