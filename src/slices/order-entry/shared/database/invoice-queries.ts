// Invoice Database Queries (Hold/Recall, Complete)

import { getDatabase } from '@/core/database/client'
import type { Invoice } from '../types'

/**
 * Get all hold invoices
 */
export async function getHoldInvoices(): Promise<Invoice[]> {
  const db = await getDatabase()
  return db.select<Invoice[]>(`
    SELECT 
      Id as id,
      CustomerId as customerId,
      CustomerName as customerName,
      EmployeeId as employeeId,
      EmployeeName as employeeName,
      ServiceMethodId as serviceMethodId,
      IsTaxExempted as isTaxExempted,
      IsMakeToGo as isMakeToGo,
      IsHold as isHold,
      SubTotal as subTotal,
      TotalDiscount as totalDiscount,
      TotalTax as totalTax,
      GrandTotal as grandTotal,
      TotalDue as totalDue,
      InvoiceAsJsonString as invoiceAsJsonString,
      CreatedDate as createdDate
    FROM Invoices 
    WHERE IsHold = 1 AND IsDeleted = 0
    ORDER BY CreatedDate DESC
  `)
}

/**
 * Save a hold invoice
 */
export async function saveHoldInvoice(
  invoice: Omit<Invoice, 'id'> & { id?: string }
): Promise<string> {
  const db = await getDatabase()
  const id = invoice.id ?? crypto.randomUUID()

  await db.execute(
    `
    INSERT OR REPLACE INTO Invoices (
      Id, CustomerId, CustomerName, EmployeeId, EmployeeName,
      ServiceMethodId, IsTaxExempted, IsMakeToGo, IsHold,
      SubTotal, TotalDiscount, TotalTax, GrandTotal, TotalDue,
      InvoiceAsJsonString, CreatedDate, IsDeleted
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, $11, $12, $13, $14,
      $15, $16, 0
    )
  `,
    [
      id,
      invoice.customerId ?? null,
      invoice.customerName ?? null,
      invoice.employeeId,
      invoice.employeeName ?? null,
      invoice.serviceMethodId,
      invoice.isTaxExempted ? 1 : 0,
      invoice.isMakeToGo ? 1 : 0,
      invoice.isHold ? 1 : 0,
      invoice.subTotal,
      invoice.totalDiscount,
      invoice.totalTax,
      invoice.grandTotal,
      invoice.totalDue,
      invoice.invoiceAsJsonString ?? null,
      invoice.createdDate?.toISOString() ?? new Date().toISOString(),
    ]
  )

  return id
}

/**
 * Delete a hold invoice (mark as deleted)
 */
export async function deleteHoldInvoice(invoiceId: string): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `
    UPDATE Invoices 
    SET IsDeleted = 1, IsHold = 0
    WHERE Id = $1
  `,
    [invoiceId]
  )
}

/**
 * Complete an invoice (set IsHold = 0, add CompletedDate)
 */
export async function completeInvoice(invoiceId: string): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `
    UPDATE Invoices 
    SET IsHold = 0, CompletedDate = $2
    WHERE Id = $1
  `,
    [invoiceId, new Date().toISOString()]
  )
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(
  invoiceId: string
): Promise<Invoice | null> {
  const db = await getDatabase()
  const result = await db.select<Invoice[]>(
    `
    SELECT 
      Id as id,
      CustomerId as customerId,
      CustomerName as customerName,
      EmployeeId as employeeId,
      EmployeeName as employeeName,
      ServiceMethodId as serviceMethodId,
      IsTaxExempted as isTaxExempted,
      IsMakeToGo as isMakeToGo,
      IsHold as isHold,
      SubTotal as subTotal,
      TotalDiscount as totalDiscount,
      TotalTax as totalTax,
      GrandTotal as grandTotal,
      TotalDue as totalDue,
      InvoiceAsJsonString as invoiceAsJsonString,
      CreatedDate as createdDate,
      CompletedDate as completedDate
    FROM Invoices 
    WHERE Id = $1 AND IsDeleted = 0
    LIMIT 1
  `,
    [invoiceId]
  )

  return result[0] ?? null
}
