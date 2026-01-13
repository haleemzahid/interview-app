// Menu Database Queries

import { getDatabase } from '@/core/database/client'
import type { Menu, MenuCategory, Product } from '../../shared/types'

/**
 * Get all active menus ordered by OrderNumber
 */
export async function getMenus(): Promise<Menu[]> {
  const db = await getDatabase()
  return db.select<Menu[]>(`
    SELECT 
      Id as id,
      Name as name,
      DisplayName as displayName,
      BackColor as backColor,
      ForeColor as foreColor,
      OrderNumber as orderNumber,
      IsNoMenu as isNoMenu
    FROM Menus 
    ORDER BY OrderNumber
  `)
}

/**
 * Get categories for a specific menu
 */
export async function getCategoriesByMenuId(
  menuId: string
): Promise<MenuCategory[]> {
  const db = await getDatabase()
  return db.select<MenuCategory[]>(
    `
    SELECT 
      Id as id,
      MenuId as menuId,
      Name as name,
      DisplayName as displayName,
      BackColor as backColor,
      ForeColor as foreColor,
      OrderNumber as orderNumber
    FROM MenuCategories 
    WHERE MenuId = $1
    ORDER BY OrderNumber
  `,
    [menuId]
  )
}

/**
 * Get products for a specific category
 */
export async function getProductsByCategoryId(
  categoryId: string
): Promise<Product[]> {
  const db = await getDatabase()
  return db.select<Product[]>(
    `
    SELECT 
      Id as id,
      MenuCategoryId as menuCategoryId,
      MenuId as menuId,
      Name as name,
      DisplayName as displayName,
      BackColor as backColor,
      ForeColor as foreColor,
      BasePrice as basePrice,
      IsTaxed as isTaxed,
      TaxGroupId as taxGroupId,
      OrderNumber as orderNumber,
      AllowedSpecialRequest as allowSpecialRequest
    FROM Products 
    WHERE MenuCategoryId = $1
    ORDER BY OrderNumber
  `,
    [categoryId]
  )
}

/**
 * Get products directly assigned to a menu (MenuProducts)
 */
export async function getProductsByMenuId(menuId: string): Promise<Product[]> {
  const db = await getDatabase()
  return db.select<Product[]>(
    `
    SELECT 
      Id as id,
      MenuCategoryId as menuCategoryId,
      MenuId as menuId,
      Name as name,
      DisplayName as displayName,
      BackColor as backColor,
      ForeColor as foreColor,
      BasePrice as basePrice,
      IsTaxed as isTaxed,
      TaxGroupId as taxGroupId,
      OrderNumber as orderNumber,
      AllowedSpecialRequest as allowSpecialRequest
    FROM Products
    WHERE MenuId = $1
    ORDER BY OrderNumber
  `,
    [menuId]
  )
}

/**
 * Get direct products (not assigned to any category or menu)
 */
export async function getDirectProducts(): Promise<Product[]> {
  const db = await getDatabase()
  return db.select<Product[]>(`
    SELECT 
      Id as id,
      MenuCategoryId as menuCategoryId,
      MenuId as menuId,
      Name as name,
      DisplayName as displayName,
      BackColor as backColor,
      ForeColor as foreColor,
      BasePrice as basePrice,
      IsTaxed as isTaxed,
      TaxGroupId as taxGroupId,
      OrderNumber as orderNumber,
      AllowedSpecialRequest as allowSpecialRequest
    FROM Products 
    WHERE (MenuCategoryId IS NULL OR MenuCategoryId = '') 
      AND (MenuId IS NULL OR MenuId = '')
    ORDER BY OrderNumber
  `)
}
