// ConfirmDialog - Reusable confirmation modal

import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'text-error',
      button: 'btn-error',
    },
    warning: {
      icon: 'text-warning',
      button: 'btn-warning',
    },
    info: {
      icon: 'text-info',
      button: 'btn-info',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm">
        {/* Icon and Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`rounded-full bg-base-200 p-3 ${styles.icon}`}>
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-base-content/70">{message}</p>
        </div>

        {/* Actions */}
        <div className="modal-action justify-center gap-3">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${styles.button}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop bg-black/50" onClick={onCancel} />
    </div>
  )
}
