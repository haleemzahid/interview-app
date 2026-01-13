// ModifierView - Main container for product configuration (XState powered)

import { useModifierFlow } from './hooks/useModifierFlow'
import { ModifierHeader } from './ModifierHeader'
import { ModifierTabs } from './ModifierTabs'
import { SizeSelector } from './SizeSelector'
import { TypeSelector } from './TypeSelector'
import { PortionSelector } from './PortionSelector'
import { ModifierGroupSelector } from './ModifierGroupSelector'
import { ToppingGrid } from './ToppingGrid'

interface ModifierViewProps {
  onConfirm: () => void
  onCancel: () => void
  onDelete: () => void
}

export function ModifierView({
  onConfirm,
  onCancel,
  onDelete,
}: ModifierViewProps) {
  const {
    product,
    item,
    currentTab,
    setCurrentTab,
    activeCategory,
    availableTabs,
    unsatisfiedMandatory,
    firstUnsatisfied,
    isCategoryLocked,
    isModifiersTabLocked,
    advanceTab,
    selectCategory,
    goToRequired,
  } = useModifierFlow()

  if (!product || !item) {
    return (
      <div className="text-base-content/50 flex h-full items-center justify-center">
        No product selected
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <ModifierHeader
        onConfirm={onConfirm}
        onCancel={onCancel}
        onDelete={onDelete}
      />

      <ModifierTabs
        availableTabs={availableTabs}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        unsatisfiedCount={unsatisfiedMandatory.length}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        {currentTab === 'sizes' && (
          <SizeSelector onAdvance={() => advanceTab('sizes')} />
        )}
        {currentTab === 'types' && (
          <TypeSelector onAdvance={() => advanceTab('types')} />
        )}
        {currentTab === 'portions' && (
          <PortionSelector onAdvance={() => advanceTab('portions')} />
        )}
        {currentTab === 'modifier-groups' && (
          <ModifierGroupSelector
            activeCategory={activeCategory}
            onSelectCategory={selectCategory}
            isCategoryLocked={isCategoryLocked}
            firstUnsatisfied={firstUnsatisfied}
          />
        )}
        {currentTab === 'modifiers' && (
          <ToppingGrid
            activeCategory={activeCategory}
            isLocked={isModifiersTabLocked}
            lockReason={firstUnsatisfied?.name}
            onGoToRequired={goToRequired}
          />
        )}
      </div>
    </div>
  )
}
