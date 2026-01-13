// useCategories hook - Fetch categories for a menu

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCategoriesByMenuId } from '../../shared/database'

export function useCategories(menuId: string | null) {
  return useQuery({
    queryKey: ['categories', menuId],
    queryFn: () =>
      menuId ? getCategoriesByMenuId(menuId) : Promise.resolve([]),
    enabled: !!menuId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  })
}
