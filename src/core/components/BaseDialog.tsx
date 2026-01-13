import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface BaseDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  actions?: ReactNode
}

/**
 * Base Dialog component for consistent modal dialogs across the application.
 *
 * @example
 * ```tsx
 * <BaseDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Create New Item"
 *   maxWidth="2xl"
 *   actions={
 *     <>
 *       <button className="btn btn-ghost" onClick={handleClose}>Cancel</button>
 *       <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
 *     </>
 *   }
 * >
 *   <form>
 *     {/* Your form content here *\/}
 *   </form>
 * </BaseDialog>
 * ```
 */
export default function BaseDialog({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '2xl',
  actions,
}: BaseDialogProps) {
  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <div className="modal modal-open">
      <div className={`modal-box ${maxWidthClasses[maxWidth]}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">{children}</div>

        {/* Actions */}
        {actions && <div className="modal-action mt-6">{actions}</div>}
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
