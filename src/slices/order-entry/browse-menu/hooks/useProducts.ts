// useProducts hook - Fetch products for a category or menu

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  getProductsByCategoryId,
  getProductsByMenuId,
  getDirectProducts,
} from '../../shared/database'

export function useProductsByCategory(categoryId: string | null) {
  return useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: () =>
      categoryId ? getProductsByCategoryId(categoryId) : Promise.resolve([]),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useProductsByMenu(menuId: string | null) {
  return useQuery({
    queryKey: ['products', 'menu', menuId],
    queryFn: () => (menuId ? getProductsByMenuId(menuId) : Promise.resolve([])),
    enabled: !!menuId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDirectProducts() {
  return useQuery({
    queryKey: ['products', 'direct'],
    queryFn: getDirectProducts,
    staleTime: 5 * 60 * 1000,
  })
}
