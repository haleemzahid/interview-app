// useResizablePanel - Hook for resizable panel with localStorage persistence

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseResizablePanelOptions {
  storageKey: string
  defaultWidth: number
  minWidth: number
  maxWidth: number
}

export function useResizablePanel({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
}: UseResizablePanelOptions) {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? parseInt(saved, 10) : defaultWidth
  })
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Save width to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(storageKey, width.toString())
  }, [storageKey, width])

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      setWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)))
    },
    [isResizing, minWidth, maxWidth]
  )

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Add/remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const startResize = useCallback(() => setIsResizing(true), [])

  return {
    width,
    panelRef,
    startResize,
    isResizing,
  }
}
