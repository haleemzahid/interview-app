// Order Entry Action Database Queries

import { getDatabase } from '@/core/database/client'
import type { OrderEntryAction } from '../types/order-entry-action'

/**
 * Get all order entry actions ordered by OrderNumber
 */
export async function getOrderEntryActions(): Promise<OrderEntryAction[]> {
  const db = await getDatabase()
  return db.select<OrderEntryAction[]>(`
    SELECT 
      Id as id,
      Type as type,
      Label as label,
      Scope as scope,
      AltLabel as altLabel,
      AltBackColor as altBackColor,
      AltForeColor as altForeColor,
      IsManagerOverrideRequired as isManagerOverrideRequired,
      ForeColor as foreColor,
      BackColor as backColor,
      OrderNumber as orderNumber
    FROM OrderEntryActions
    ORDER BY OrderNumber
  `)
}

/**
 * Get actions filtered by scope
 */
export async function getOrderEntryActionsByScope(
  scope: 'Invoice' | 'Item' | 'None'
): Promise<OrderEntryAction[]> {
  const db = await getDatabase()
  return db.select<OrderEntryAction[]>(
    `
    SELECT 
      Id as id,
      Type as type,
      Label as label,
      Scope as scope,
      AltLabel as altLabel,
      AltBackColor as altBackColor,
      AltForeColor as altForeColor,
      IsManagerOverrideRequired as isManagerOverrideRequired,
      ForeColor as foreColor,
      BackColor as backColor,
      OrderNumber as orderNumber
    FROM OrderEntryActions
    WHERE Scope = $1
    ORDER BY OrderNumber
  `,
    [scope]
  )
}
