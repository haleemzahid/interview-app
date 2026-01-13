// ResizeHandle - Draggable handle for resizable panels

import { GripVertical } from 'lucide-react'

interface ResizeHandleProps {
  onMouseDown: () => void
  position?: 'left' | 'right'
}

export function ResizeHandle({
  onMouseDown,
  position = 'right',
}: ResizeHandleProps) {
  const positionClass = position === 'right' ? 'right-0' : 'left-0'

  return (
    <div
      className={`absolute top-0 ${positionClass} z-10 flex h-full w-2 cursor-col-resize items-center justify-center hover:bg-primary/20`}
      onMouseDown={onMouseDown}
    >
      <GripVertical className="text-base-content/30 h-6 w-3" />
    </div>
  )
}
