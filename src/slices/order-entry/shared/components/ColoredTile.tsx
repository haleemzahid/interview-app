// Colored Tile - Base component for menu items, products, toppings
// Uses dynamic colors from database

import { type ReactNode, memo } from 'react'

interface ColoredTileProps {
  backColor?: string | null
  foreColor?: string | null
  children: ReactNode
  isSelected?: boolean
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export const ColoredTile = memo(function ColoredTile({
  backColor,
  foreColor,
  children,
  isSelected = false,
  onClick,
  className = '',
  disabled = false,
}: ColoredTileProps) {
  // Default colors if not provided
  const bgColor = backColor || '#374151' // gray-700
  const fgColor = foreColor || '#ffffff'

  return (
    <div
      className={`
        w-full p-1 rounded-lg
        ${isSelected ? 'bg-cyan-400' : 'bg-transparent'}
      `}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          backgroundColor: bgColor,
          color: fgColor,
        }}
        className={`
          w-full flex items-center justify-center
          min-h-12 px-3 py-2
          rounded-md font-medium text-sm
          border border-base-300
          transition-transform
          touch-manipulation select-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:scale-95'}
          ${className}
        `}
      >
        {children}
      </button>
    </div>
  )
})
