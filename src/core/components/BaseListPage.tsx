import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCard {
  label: string
  value: number | string
  icon?: LucideIcon
  color?: 'primary' | 'success' | 'warning' | 'error' | 'base-content'
}

interface BaseListPageProps {
  title: string
  description?: string
  actionButton?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
  }
  stats?: StatCard[]
  isLoading?: boolean
  error?: Error | string | null
  children: ReactNode
}

/**
 * Base List Page component for consistent list pages across the application.
 * Provides standard header, stats cards, loading/error states, and content area.
 *
 * @example
 * ```tsx
 * <BaseListPage
 *   title="Todos"
 *   description="Manage your tasks"
 *   actionButton={{
 *     label: "New Todo",
 *     icon: Plus,
 *     onClick: handleCreate
 *   }}
 *   stats={[
 *     { label: "Total", value: 42, icon: ListTodo, color: "primary" },
 *     { label: "Completed", value: 20, color: "success" }
 *   ]}
 *   isLoading={isLoading}
 *   error={error}
 * >
 *   <TodoTable data={todos} />
 * </BaseListPage>
 * ```
 */
export default function BaseListPage({
  title,
  description,
  actionButton,
  stats,
  isLoading = false,
  error = null,
  children,
}: BaseListPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-base-content">{title}</h1>
          {description && (
            <p className="text-base-content/70 mt-2">{description}</p>
          )}
        </div>
        {actionButton && (
          <button
            className="btn btn-primary gap-2"
            onClick={actionButton.onClick}
          >
            {actionButton.icon && <actionButton.icon className="w-5 h-5" />}
            {actionButton.label}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        <div
          className="grid grid-cols-1 gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {stats.map((stat, index) => {
            const colorClass =
              stat.color === 'base-content'
                ? 'text-base-content'
                : `text-${stat.color}`

            return (
              <div
                key={`${stat.label}-${index}`}
                className="stat bg-base-100 rounded-lg shadow"
              >
                {stat.icon && (
                  <div className={`stat-figure ${colorClass}`}>
                    <stat.icon className="w-8 h-8" />
                  </div>
                )}
                <div className="stat-title">{stat.label}</div>
                <div className={`stat-value ${colorClass}`}>{stat.value}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-error">
          <span>
            Error: {typeof error === 'string' ? error : error.toString()}
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        /* Content */
        children
      )}
    </div>
  )
}
