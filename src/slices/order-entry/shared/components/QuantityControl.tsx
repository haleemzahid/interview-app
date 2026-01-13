// Quantity Control - [-] [qty] [+] buttons

import { Minus, Plus } from 'lucide-react'

interface QuantityControlProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
}: QuantityControlProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  }

  const countSizeClasses = {
    sm: 'w-8 text-sm',
    md: 'w-10 text-base',
    lg: 'w-14 text-lg',
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className={`
          btn btn-circle btn-ghost btn-sm
          ${sizeClasses[size]}
          ${value <= min ? 'opacity-30 cursor-not-allowed' : ''}
        `}
        aria-label="Decrease quantity"
      >
        <Minus size={iconSizes[size]} />
      </button>

      <span
        className={`
          text-center font-semibold tabular-nums
          ${countSizeClasses[size]}
        `}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className={`
          btn btn-circle btn-ghost btn-sm
          ${sizeClasses[size]}
          ${value >= max ? 'opacity-30 cursor-not-allowed' : ''}
        `}
        aria-label="Increase quantity"
      >
        <Plus size={iconSizes[size]} />
      </button>
    </div>
  )
}
