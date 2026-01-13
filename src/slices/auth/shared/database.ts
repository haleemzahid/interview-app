import { getDatabase } from '@/core/database/client'
import type { Employee, Role } from './types'

/**
 * Get employee by 4-digit PIN login
 */
export async function getEmployeeByLogin(
  pin: string
): Promise<Employee | null> {
  const db = await getDatabase()
  const result = await db.select<Employee[]>(
    'SELECT * FROM Employees WHERE Login = ?',
    [pin]
  )
  return result.length > 0 ? result[0] : null
}

/**
 * Get role by ID
 */
export async function getRoleById(roleId: string): Promise<Role | null> {
  const db = await getDatabase()
  const result = await db.select<Role[]>('SELECT * FROM Roles WHERE Id = ?', [
    roleId,
  ])
  return result.length > 0 ? result[0] : null
}

/**
 * Authenticate employee and return with role data
 */
export async function authenticateEmployee(
  pin: string
): Promise<{ employee: Employee; role: Role } | null> {
  const employee = await getEmployeeByLogin(pin)
  if (!employee) return null

  const role = await getRoleById(employee.RoleId)
  if (!role) return null

  return { employee, role }
}

/**
 * Parse comma-separated rights string into array
 */
export function parseRights(rights: string): string[] {
  return rights.split(',').map((r) => r.trim())
}
