// MenuTopBar - Top toolbar with search, open items, and view controls

import {
  Search,
  CircleDot,
  CheckSquare,
  ArrowLeftRight,
  LogOut,
  MoreVertical,
} from 'lucide-react'
import { ConfigurableButton } from '../../shared/components'

interface MenuTopBarProps {
  onSearch?: () => void
  onOpenItems?: () => void
  onAllChecks?: () => void
  onSwitch?: () => void
  onExit?: () => void
  onToggleLayout?: () => void
}

export function MenuTopBar({
  onSearch,
  onOpenItems,
  onAllChecks,
  onSwitch,
  onExit,
}: MenuTopBarProps) {
  return (
    <div className="border-base-300 flex items-center justify-between border-b p-2">
      {/* Left side buttons */}
      <div className="flex gap-2">
        <ConfigurableButton configName="Search" onClick={onSearch} flex={false}>
          <Search className="mr-1 h-4 w-4" />
          Search
        </ConfigurableButton>
        <ConfigurableButton
          configName="Open Items"
          onClick={onOpenItems}
          flex={false}
          className="min-w-28"
        >
          <CircleDot className="mr-1 h-4 w-4" />
          Open Items
        </ConfigurableButton>
      </div>

      {/* Right side buttons */}
      <div className="flex gap-2">
        <ConfigurableButton
          configName="All Checks"
          onClick={onAllChecks}
          flex={false}
          className="min-w-28"
        >
          <CheckSquare className="mr-1 h-4 w-4" />
          All Checks
        </ConfigurableButton>
        <ConfigurableButton configName="Switch" onClick={onSwitch} flex={false}>
          <ArrowLeftRight className="mr-1 h-4 w-4" />
          Switch
        </ConfigurableButton>
        <ConfigurableButton configName="Exit" onClick={onExit} flex={false}>
          <LogOut className="h-4 w-4" />
        </ConfigurableButton>
        <button className="btn btn-ghost btn-sm">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
