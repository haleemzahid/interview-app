// UI Control Queries - Fetch button/control configuration from database

import { getDatabase } from '@/core/database/client'
import type { UIControl } from '../types/ui-control'

// In-memory cache for UI controls
const uiControlCache = new Map<string, UIControl>()

/**
 * Get UI control configuration by name
 */
export async function getUIControlByName(
  name: string
): Promise<UIControl | null> {
  // Check cache first
  if (uiControlCache.has(name)) {
    return uiControlCache.get(name)!
  }

  const db = await getDatabase()
  const results = await db.select<UIControl[]>(
    `
    SELECT 
      Id as id,
      Name as name,
      DisplayName as displayName,
      ForeColor as foreColor,
      BackColor as backColor,
      FontSize as fontSize
    FROM UIControls 
    WHERE Name = ?
    LIMIT 1
  `,
    [name]
  )

  const control = results[0] ?? null
  if (control) {
    uiControlCache.set(name, control)
  }
  return control
}

/**
 * Get all UI controls
 */
export async function getAllUIControls(): Promise<UIControl[]> {
  const db = await getDatabase()
  return db.select<UIControl[]>(`
    SELECT 
      Id as id,
      Name as name,
      DisplayName as displayName,
      ForeColor as foreColor,
      BackColor as backColor,
      FontSize as fontSize
    FROM UIControls
  `)
}

/**
 * Clear the UI control cache (call after admin changes config)
 */
export function clearUIControlCache(): void {
  uiControlCache.clear()
}
