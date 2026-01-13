import { ArrowUpDown } from 'lucide-react'
import type { Column } from '@tanstack/react-table'

/**
 * Creates a sortable header button for table columns
 */
export function SortableHeader<TData>({
  column,
  children,
}: {
  column: Column<TData>
  children: React.ReactNode
}) {
  return (
    <button
      className="flex items-center gap-2 hover:text-primary"
      onClick={() => column.toggleSorting()}
    >
      {children}
      <ArrowUpDown className="w-4 h-4" />
    </button>
  )
}

/**
 * Badge component for table cells with different variants
 */
export function TableBadge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
}) {
  const variantClasses = {
    default: '',
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
  }

  return (
    <div className={`badge badge-sm capitalize ${variantClasses[variant]}`}>
      {children}
    </div>
  )
}

/**
 * Standard action buttons for table rows
 */
export function TableActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2">{children}</div>
}

/**
 * Individual action button
 */
export function TableActionButton({
  onClick,
  title,
  variant = 'ghost',
  children,
}: {
  onClick: () => void
  title: string
  variant?: 'ghost' | 'error'
  children: React.ReactNode
}) {
  return (
    <button
      className={`btn btn-ghost btn-xs ${variant === 'error' ? 'text-error' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}
