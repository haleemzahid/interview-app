import { LucideIcon } from 'lucide-react'
import { todosConfig } from '../slices/todos/config'
import { orderEntryNavItem } from '@/slices/order-entry/config'

/**
 * Navigation Item Interface
 *
 * @property label - Display text for the nav item
 * @property path - Route path (optional for parent items with children)
 * @property icon - Lucide React icon component
 * @property badge - Optional badge text (e.g., "New", "Beta", "3")
 * @property children - Optional nested navigation items (creates collapsible menu)
 */
export interface NavItem {
  label: string
  path?: string
  icon: LucideIcon
  badge?: string
  children?: NavItem[]
}

/**
 * Navigation items - automatically populated from slice configs
 * To add a new nav item, create a config.ts in your slice and import it here
 */
export const navItems: NavItem[] = [todosConfig, orderEntryNavItem]
