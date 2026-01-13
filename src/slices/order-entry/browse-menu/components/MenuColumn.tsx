// Menu Column - Single column in the horizontal menu layout

import { memo, type ReactNode } from 'react'
import { useUIControl } from '../../shared/hooks/useUIControl'

interface MenuColumnProps {
  title: string
  configName: string
  children: ReactNode
  isLoading?: boolean
}

export const MenuColumn = memo(function MenuColumn({
  title,
  configName,
  children,
  isLoading = false,
}: MenuColumnProps) {
  const { data: config } = useUIControl(configName)

  const headerStyle: React.CSSProperties = {
    backgroundColor: config?.backColor ?? '#E0E0E0',
    color: config?.foreColor ?? '#000000',
    borderColor: config?.backColor ?? '#E0E0E0',
  }

  return (
    <div className="flex h-full min-w-[200px] flex-1 flex-col">
      {/* Column Header */}
      <div
        className="mb-2 rounded border-2 px-3 py-2 text-center"
        style={headerStyle}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide">
          {config?.displayName ?? title}
        </h3>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-sm" />
          </div>
        ) : (
          <div className="flex flex-col gap-2 pr-2">{children}</div>
        )}
      </div>
    </div>
  )
})
