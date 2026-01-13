// Menu Browse View - Horizontal columns for menu navigation
// Optimized with virtualization and prefetching for fast rendering

import {
  MenuColumn,
  MenuTopBar,
  MenuBottomBar,
  VirtualizedTileGrid,
} from './components'
import { useMenuBrowse } from './hooks/useMenuBrowse'
import { usePrefetch } from './hooks/usePrefetch'
import type { Product, Menu, MenuCategory } from '../shared/types'

interface MenuBrowseViewProps {
  onProductSelect: (product: Product) => void | Promise<void>
}

export function MenuBrowseView({ onProductSelect }: MenuBrowseViewProps) {
  const handleProduct = (product: Product) => {
    void onProductSelect(product)
  }

  const {
    selectedMenuId,
    selectedCategoryId,
    visibleMenus,
    categories,
    menuProducts,
    categoryProducts,
    menusLoading,
    categoriesLoading,
    menuProductsLoading,
    categoryProductsLoading,
    handleMenuSelect,
    handleCategorySelect,
    handleProductSelect,
  } = useMenuBrowse(handleProduct)

  const { prefetchCategories, prefetchMenuProducts, prefetchCategoryProducts } =
    usePrefetch()

  // Prefetch on hover handlers
  const handleMenuHover = (menu: Menu) => {
    prefetchCategories(menu.id)
    prefetchMenuProducts(menu.id)
  }

  const handleCategoryHover = (category: MenuCategory) => {
    prefetchCategoryProducts(category.id)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* Top Bar */}
      <MenuTopBar />

      {/* Main Content */}
      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto p-4 pb-16">
        <div className="flex h-full min-w-full gap-2">
          <MenuColumn title="Menus" configName="Menus" isLoading={menusLoading}>
            <VirtualizedTileGrid
              items={visibleMenus}
              selectedId={selectedMenuId}
              onItemClick={(item) => handleMenuSelect(item as Menu)}
              onItemHover={(item) => handleMenuHover(item as Menu)}
            />
          </MenuColumn>

          {/* Column 2: Menu Products - Virtualized for performance */}
          <MenuColumn
            title="Menu Items"
            configName="Menu Products"
            isLoading={menuProductsLoading}
          >
            <VirtualizedTileGrid
              items={menuProducts}
              showPrice
              onItemClick={(item) => handleProductSelect(item as Product)}
            />
          </MenuColumn>

          {/* Column 3: Categories (Menu Groups) */}
          <MenuColumn
            title="Menu Groups"
            configName="Menu Groups"
            isLoading={categoriesLoading}
          >
            {categories.length > 0 ? (
              <VirtualizedTileGrid
                items={categories}
                selectedId={selectedCategoryId}
                onItemClick={(item) =>
                  handleCategorySelect(item as MenuCategory)
                }
                onItemHover={(item) =>
                  handleCategoryHover(item as MenuCategory)
                }
              />
            ) : (
              <div className="text-base-content/50 py-4 text-center text-sm">
                No menu groups
              </div>
            )}
          </MenuColumn>

          {/* Column 4: Category Products - Virtualized for performance */}
          <MenuColumn
            title="Products"
            configName="Products"
            isLoading={
              categoryProductsLoading ||
              (categoriesLoading && !selectedCategoryId)
            }
          >
            {categoryProducts.length > 0 ? (
              <VirtualizedTileGrid
                items={categoryProducts}
                showPrice
                onItemClick={(item) => handleProductSelect(item as Product)}
              />
            ) : (
              <div className="text-base-content/50 py-4 text-center text-sm">
                No products
              </div>
            )}
          </MenuColumn>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <MenuBottomBar />
    </div>
  )
}
