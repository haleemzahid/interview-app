// usePrefetch - Prefetch data on hover for instant loading

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  getCategoriesByMenuId,
  getProductsByCategoryId,
  getProductsByMenuId,
} from '../../shared/database'

export function usePrefetch() {
  const queryClient = useQueryClient()

  const prefetchCategories = useCallback(
    (menuId: string) => {
      void queryClient.prefetchQuery({
        queryKey: ['categories', menuId],
        queryFn: () => getCategoriesByMenuId(menuId),
        staleTime: 5 * 60 * 1000,
      })
    },
    [queryClient]
  )

  const prefetchCategoryProducts = useCallback(
    (categoryId: string) => {
      void queryClient.prefetchQuery({
        queryKey: ['products', 'category', categoryId],
        queryFn: () => getProductsByCategoryId(categoryId),
        staleTime: 5 * 60 * 1000,
      })
    },
    [queryClient]
  )

  const prefetchMenuProducts = useCallback(
    (menuId: string) => {
      void queryClient.prefetchQuery({
        queryKey: ['products', 'menu', menuId],
        queryFn: () => getProductsByMenuId(menuId),
        staleTime: 5 * 60 * 1000,
      })
    },
    [queryClient]
  )

  return {
    prefetchCategories,
    prefetchCategoryProducts,
    prefetchMenuProducts,
  }
}
