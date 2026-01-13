// Lookup Queries (Service Methods, Payment Methods, Discounts, Tax Rates)

import { getDatabase } from '@/core/database/client'
import type {
  ServiceMethod,
  PaymentMethod,
  Discount,
  TaxRate,
  Customer,
} from '../../shared/types'

/**
 * Get all service methods
 */
export async function getServiceMethods(): Promise<ServiceMethod[]> {
  const db = await getDatabase()
  return db.select<ServiceMethod[]>(`
    SELECT 
      Id as id,
      Name as name,
      DisplayName as displayName,
      OrderNumber as orderNumber
    FROM ServiceMethods 
    ORDER BY OrderNumber
  `)
}

/**
 * Get all payment methods
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const db = await getDatabase()
  return db.select<PaymentMethod[]>(`
    SELECT 
      Id as id,
      Name as name,
      DisplayName as displayName,
      OrderNumber as orderNumber,
      IsActive as isActive
    FROM PaymentMethods 
    WHERE IsActive = 1 AND IsDeleted = 0
    ORDER BY OrderNumber
  `)
}

/**
 * Get all discounts from InvoiceDiscounts table
 */
export async function getDiscounts(): Promise<Discount[]> {
  const db = await getDatabase()
  return db.select<Discount[]>(`
    SELECT 
      Id as id,
      Name as name,
      DisplayName as displayName,
      DiscountPercentage as discountPercentage,
      Type as type,
      IsForWholeInvoice as isForWholeInvoice,
      BackColor as backColor,
      ForeColor as foreColor,
      OrderNumber as orderNumber
    FROM InvoiceDiscounts 
    ORDER BY OrderNumber
  `)
}

/**
 * Get tax rate for a specific tax group and service method
 */
export async function getTaxRate(
  taxGroupId: string,
  serviceMethodId: string
): Promise<number> {
  const db = await getDatabase()
  const result = await db.select<{ rate: number }[]>(
    `
    SELECT Rate as rate
    FROM TaxRates 
    WHERE TaxGroupId = $1 AND ServiceMethodId = $2
    LIMIT 1
  `,
    [taxGroupId, serviceMethodId]
  )

  return result[0]?.rate ?? 0
}

/**
 * Get all tax rates (for caching)
 */
export async function getAllTaxRates(): Promise<TaxRate[]> {
  const db = await getDatabase()
  return db.select<TaxRate[]>(`
    SELECT 
      Id as id,
      TaxGroupId as taxGroupId,
      ServiceMethodId as serviceMethodId,
      Rate as rate
    FROM TaxRates
  `)
}

/**
 * Search customers by name or phone
 */
export async function searchCustomers(query: string): Promise<Customer[]> {
  const db = await getDatabase()
  const searchTerm = `%${query}%`
  return db.select<Customer[]>(
    `
    SELECT 
      Id as id,
      FirstName as firstName,
      LastName as lastName,
      COALESCE(FirstName || ' ' || LastName, FirstName, LastName, '') as name,
      Phone as phone,
      Email as email,
      IsTaxExempt as isTaxExempt
    FROM Customers 
    WHERE (FirstName LIKE $1 OR LastName LIKE $1 OR Phone LIKE $1)
      AND IsActive = 1 AND IsDeleted = 0
    ORDER BY FirstName, LastName
    LIMIT 20
  `,
    [searchTerm]
  )
}

/**
 * Get customer by ID
 */
export async function getCustomerById(
  customerId: string
): Promise<Customer | null> {
  const db = await getDatabase()
  const result = await db.select<Customer[]>(
    `
    SELECT 
      Id as id,
      FirstName as firstName,
      LastName as lastName,
      COALESCE(FirstName || ' ' || LastName, FirstName, LastName, '') as name,
      Phone as phone,
      Email as email,
      IsTaxExempt as isTaxExempt
    FROM Customers 
    WHERE Id = $1
    LIMIT 1
  `,
    [customerId]
  )

  return result[0] ?? null
}
