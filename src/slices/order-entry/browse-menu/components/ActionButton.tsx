// ActionButton - Single action button with dynamic styling from database

import type { OrderEntryAction } from '../../shared/types/order-entry-action'

interface ActionButtonProps {
  action: OrderEntryAction
  disabled?: boolean
  isActive?: boolean
  onClick: () => void
}

export function ActionButton({
  action,
  disabled = false,
  isActive = false,
  onClick,
}: ActionButtonProps) {
  // Use alt colors when active
  const bgColor = isActive ? action.altBackColor : action.backColor
  const fgColor = isActive ? action.altForeColor : action.foreColor
  const label = isActive ? (action.altLabel ?? action.label) : action.label

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: bgColor ?? '#ffffff',
        color: fgColor ?? '#000000',
      }}
      className={`
        btn btn-sm px-3
        border border-base-300
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {label}
    </button>
  )
}
