// CartHeader - Top section of cart panel with customer info and actions

import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { ServiceMethodSelect } from './ServiceMethodSelect'
import { CurrentUserBadge } from './CurrentUserBadge'
import { ConfigurableButton } from '../shared/components'
import type { ServiceMethod } from '../shared/types'

interface CartHeaderProps {
  serviceMethod: ServiceMethod | null
  onServiceMethodChange: (method: ServiceMethod | null) => void
  onCancel: () => void
  onDiscount: () => void
}

export function CartHeader({
  serviceMethod,
  onServiceMethodChange,
  onCancel,
  onDiscount,
}: CartHeaderProps) {
  return (
    <>
      {/* Row 1: Back, Customer Type, Tab Name */}
      <div className="border-base-300 flex items-center gap-2 border-b p-2">
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="font-medium">Walk-In</span>
        <button className="btn btn-outline btn-sm flex-1">
          <LayoutGrid className="h-4 w-4" />
          Tab Name
        </button>
      </div>

      {/* Row 2: Service Method, Employee */}
      <div className="border-base-300 flex items-end gap-2 border-b p-2">
        <ServiceMethodSelect
          value={serviceMethod}
          onChange={onServiceMethodChange}
        />
        <CurrentUserBadge />
      </div>

      {/* Row 3: Action Buttons */}
      <div className="border-base-300 flex gap-2 border-b p-2">
        <ConfigurableButton configName="Svc change" />
        <ConfigurableButton configName="Split" />
        <ConfigurableButton configName="Discount" onClick={onDiscount} />
      </div>
    </>
  )
}
