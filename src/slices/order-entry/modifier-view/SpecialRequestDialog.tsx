// SpecialRequestDialog - Dialog for adding special requests with description and price

import { useState } from 'react'
import { BaseDialog } from '@/core/components'

interface SpecialRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (description: string, price: number) => void
}

export function SpecialRequestDialog({
  isOpen,
  onClose,
  onSave,
}: SpecialRequestDialogProps) {
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0.00')

  const handleSave = () => {
    if (!description.trim()) return
    onSave(description.trim(), parseFloat(price) || 0)
    // Reset form
    setDescription('')
    setPrice('0.00')
    onClose()
  }

  const handleCancel = () => {
    setDescription('')
    setPrice('0.00')
    onClose()
  }

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={handleCancel}
      title="Special Request"
      maxWidth="sm"
      actions={
        <>
          <button className="btn btn-ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!description.trim()}
          >
            Save
          </button>
        </>
      }
    >
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Description</legend>
        <input
          type="text"
          className="input w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter special request..."
          autoFocus
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Price</legend>
        <input
          type="number"
          className="input w-full"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0"
          step="0.01"
        />
      </fieldset>
    </BaseDialog>
  )
}
