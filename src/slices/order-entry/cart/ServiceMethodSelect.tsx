// ServiceMethodSelect - Dropdown to select service method

import { useServiceMethods } from '../browse-menu/hooks/useServiceMethods'
import type { ServiceMethod } from '../shared/types'

interface ServiceMethodSelectProps {
  value: ServiceMethod | null
  onChange: (method: ServiceMethod | null) => void
}

export function ServiceMethodSelect({
  value,
  onChange,
}: ServiceMethodSelectProps) {
  const { data: serviceMethods, isLoading } = useServiceMethods()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    if (!selectedId) {
      onChange(null)
      return
    }
    const method = serviceMethods?.find(
      (m: ServiceMethod) => m.id === selectedId
    )
    onChange(method ?? null)
  }

  return (
    <div className="flex-1">
      <label className="text-base-content/60 text-xs">Service Methods</label>
      <select
        className="select select-bordered select-sm w-full"
        value={value?.id ?? ''}
        onChange={handleChange}
        disabled={isLoading}
      >
        <option value="">Select...</option>
        {serviceMethods?.map((method: ServiceMethod) => (
          <option key={method.id} value={method.id}>
            {method.displayName ?? method.name}
          </option>
        ))}
      </select>
    </div>
  )
}
