// VirtualizedTileGrid - Virtualized grid for large product lists
// Uses TanStack Virtual to only render visible items

import { useRef, useMemo, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { formatCurrency } from '../../shared/utils/pricing'

interface TileItem {
  id: string
  name: string
  displayName?: string | null
  backColor?: string | null
  foreColor?: string | null
  basePrice?: number | string
}

interface VirtualizedTileGridProps {
  items: TileItem[]
  selectedId?: string | null
  showPrice?: boolean
  onItemClick: (item: TileItem) => void
  onItemHover?: (item: TileItem) => void
  columns?: number
  itemHeight?: number
}

// Memoized tile for optimal performance
const VirtualTile = memo(function VirtualTile({
  item,
  isSelected,
  showPrice,
  onClick,
  onHover,
}: {
  item: TileItem
  isSelected: boolean
  showPrice: boolean
  onClick: () => void
  onHover?: () => void
}) {
  const displayName = item.displayName ?? item.name
  const hasPrice = showPrice && item.basePrice && Number(item.basePrice) > 0
  const bgColor = item.backColor || '#374151'
  const fgColor = item.foreColor || '#ffffff'

  return (
    <div
      className={`p-0.5 ${isSelected ? 'bg-cyan-400 rounded-lg' : ''}`}
      onMouseEnter={onHover}
    >
      <button
        type="button"
        onClick={onClick}
        style={{ backgroundColor: bgColor, color: fgColor }}
        className="w-full flex flex-col items-center justify-center min-h-12 px-2 py-1.5 rounded-md font-medium text-sm border border-base-300 hover:brightness-110 active:scale-95 transition-transform"
      >
        <span className="text-center leading-tight line-clamp-2 text-xs">
          {displayName}
        </span>
        {hasPrice && (
          <span className="text-xs opacity-80">
            {formatCurrency(item.basePrice ?? 0)}
          </span>
        )}
      </button>
    </div>
  )
})

export function VirtualizedTileGrid({
  items,
  selectedId,
  showPrice = false,
  onItemClick,
  onItemHover,
  columns = 1,
  itemHeight = 56,
}: VirtualizedTileGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Group items into rows for grid layout
  const rows = useMemo(() => {
    const result: TileItem[][] = []
    for (let i = 0; i < items.length; i += columns) {
      result.push(items.slice(i, i + columns))
    }
    return result
  }, [items, columns])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5, // Render 5 extra rows for smoother scrolling
  })

  if (items.length === 0) {
    return null
  }

  return (
    <div
      ref={parentRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden pr-1"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowItems = rows[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`grid gap-1 ${columns > 1 ? `grid-cols-${columns}` : ''}`}
            >
              {rowItems.map((item) => (
                <VirtualTile
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedId}
                  showPrice={showPrice}
                  onClick={() => onItemClick(item)}
                  onHover={onItemHover ? () => onItemHover(item) : undefined}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
