// useMenuBrowse - State and handlers for menu browsing

import { useState, useCallback, useEffect } from 'react'
import { useMenus } from './useMenus'
import { useCategories } from './useCategories'
import { useProductsByCategory, useProductsByMenu } from './useProducts'
import type { Menu, MenuCategory, Product } from '../../shared/types'

export function useMenuBrowse(
  onProductSelect: (product: Product) => void | Promise<void>
) {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  )

  // Data fetching
  const { data: menus = [], isLoading: menusLoading } = useMenus()
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories(selectedMenuId)
  const { data: menuProducts = [], isLoading: menuProductsLoading } =
    useProductsByMenu(selectedMenuId)
  const { data: categoryProducts = [], isLoading: categoryProductsLoading } =
    useProductsByCategory(selectedCategoryId)

  const visibleMenus = menus.filter((m) => !m.isNoMenu)

  // Auto-select first menu
  useEffect(() => {
    if (visibleMenus.length > 0 && !selectedMenuId) {
      setSelectedMenuId(visibleMenus[0].id)
    }
  }, [visibleMenus, selectedMenuId])

  // Auto-select first category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  // Handlers
  const handleMenuSelect = useCallback((menu: Menu) => {
    setSelectedMenuId(menu.id)
    setSelectedCategoryId(null)
  }, [])

  const handleCategorySelect = useCallback((category: MenuCategory) => {
    setSelectedCategoryId(category.id)
  }, [])

  const handleProductSelect = useCallback(
    (product: Product) => {
      void onProductSelect(product)
    },
    [onProductSelect]
  )

  return {
    // State
    selectedMenuId,
    selectedCategoryId,

    // Data
    visibleMenus,
    categories,
    menuProducts,
    categoryProducts,

    // Loading states
    menusLoading,
    categoriesLoading,
    menuProductsLoading,
    categoryProductsLoading,

    // Handlers
    handleMenuSelect,
    handleCategorySelect,
    handleProductSelect,
  }
}
