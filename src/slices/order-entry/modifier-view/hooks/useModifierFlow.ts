// useModifierFlow - All modifier tab state & logic extracted from ModifierView

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useEditingItem, useEditingProduct } from '../../shared/machines'
import type { ToppingCategory } from '../../shared/types'

export type ModifierTab =
  | 'sizes'
  | 'types'
  | 'portions'
  | 'modifier-groups'
  | 'modifiers'

export function useModifierFlow() {
  const product = useEditingProduct()
  const item = useEditingItem()
  const [currentTab, setCurrentTab] = useState<ModifierTab>('sizes')
  const [activeCategory, setActiveCategory] = useState<ToppingCategory | null>(
    null
  )

  // Determine available tabs based on product
  const availableTabs = useMemo(() => {
    const tabs: ModifierTab[] = []
    if (product?.assignedSizes?.length) tabs.push('sizes')
    if (product?.productTypes?.length) tabs.push('types')
    if (product?.portionTypes?.length) tabs.push('portions')
    if ((product?.toppingCategories?.length ?? 0) > 1)
      tabs.push('modifier-groups')
    if (product?.toppingCategories?.length) tabs.push('modifiers')
    return tabs
  }, [product])

  // Get mandatory categories
  const mandatoryCategories = useMemo(() => {
    return product?.toppingCategories?.filter((c) => c.isMandatory) ?? []
  }, [product?.toppingCategories])

  // Check which mandatory categories are unsatisfied
  const unsatisfiedMandatory = useMemo(() => {
    if (!item) return mandatoryCategories
    return mandatoryCategories.filter((category) => {
      const toppingIds = new Set(category.toppings?.map((t) => t.id) ?? [])
      const hasSelection = item.modifiers.some((m) =>
        toppingIds.has(m.topping.id)
      )
      return !hasSelection
    })
  }, [item?.modifiers, mandatoryCategories])

  const firstUnsatisfied = unsatisfiedMandatory[0] ?? null

  // Check if a category is locked (optional when mandatory not satisfied)
  const isCategoryLocked = useCallback(
    (category: ToppingCategory): boolean => {
      if (unsatisfiedMandatory.length === 0) return false
      return !category.isMandatory
    },
    [unsatisfiedMandatory]
  )

  // Is modifiers tab locked due to viewing optional category?
  const isModifiersTabLocked =
    unsatisfiedMandatory.length > 0 &&
    activeCategory &&
    !activeCategory.isMandatory

  // Set initial tab when product changes
  useEffect(() => {
    if (product && availableTabs.length > 0) {
      setCurrentTab(availableTabs[0])
      if (product.toppingCategories?.length) {
        setActiveCategory(product.toppingCategories[0])
      }
    }
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Advance to next tab
  const advanceTab = useCallback(
    (fromTab: ModifierTab) => {
      const tabOrder: ModifierTab[] = [
        'sizes',
        'types',
        'portions',
        'modifier-groups',
        'modifiers',
      ]
      const currentIndex = tabOrder.indexOf(fromTab)
      for (let i = currentIndex + 1; i < tabOrder.length; i++) {
        if (availableTabs.includes(tabOrder[i])) {
          setCurrentTab(tabOrder[i])
          return
        }
      }
    },
    [availableTabs]
  )

  // Select category and go to modifiers tab
  const selectCategory = useCallback((cat: ToppingCategory) => {
    setActiveCategory(cat)
    setCurrentTab('modifiers')
  }, [])

  // Go to first unsatisfied required category
  const goToRequired = useCallback(() => {
    if (firstUnsatisfied) {
      setActiveCategory(firstUnsatisfied)
    }
  }, [firstUnsatisfied])

  return {
    product,
    item,
    currentTab,
    setCurrentTab,
    activeCategory,
    availableTabs,
    unsatisfiedMandatory,
    firstUnsatisfied,
    isCategoryLocked,
    isModifiersTabLocked: isModifiersTabLocked ?? false,
    advanceTab,
    selectCategory,
    goToRequired,
  }
}
