// useMenus hook - Fetch all menus

import { useQuery } from '@tanstack/react-query'
import { getMenus } from '../../shared/database'

export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: getMenus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
