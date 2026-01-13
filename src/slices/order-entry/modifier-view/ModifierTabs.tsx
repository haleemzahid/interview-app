// ModifierTabs - Tab bar for Size/Type/Portion/ModifierGroups/Modifiers

import { cn } from '@/slices/shared/utils/cn'
import type { ModifierTab } from './hooks/useModifierFlow'

const TAB_LABELS: Record<ModifierTab, string> = {
  sizes: 'Sizes',
  types: 'Types',
  portions: 'Portions',
  'modifier-groups': 'Modifier Groups',
  modifiers: 'Modifiers',
}

interface ModifierTabsProps {
  availableTabs: ModifierTab[]
  currentTab: ModifierTab
  onTabChange: (tab: ModifierTab) => void
  unsatisfiedCount?: number
}

export function ModifierTabs({
  availableTabs,
  currentTab,
  onTabChange,
  unsatisfiedCount = 0,
}: ModifierTabsProps) {
  if (availableTabs.length === 0) return null

  return (
    <div className="border-base-300 bg-base-100 flex gap-2 border-b px-4 py-2">
      {availableTabs.map((tab) => {
        const isActive = tab === currentTab
        // Show warning badge on modifier-groups tab when mandatory items unsatisfied
        const showWarning =
          (tab === 'modifier-groups' || tab === 'modifiers') &&
          unsatisfiedCount > 0

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              'btn btn-sm relative',
              isActive ? 'btn-primary' : 'btn-ghost',
              showWarning && !isActive && 'text-warning'
            )}
          >
            {TAB_LABELS[tab]}
            {showWarning && tab === 'modifier-groups' && (
              <span className="badge badge-warning badge-xs absolute -right-1 -top-1">
                {unsatisfiedCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
