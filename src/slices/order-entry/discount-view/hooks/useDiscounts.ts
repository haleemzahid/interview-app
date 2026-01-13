// useDiscounts - Fetch discounts from database

import { useQuery } from '@tanstack/react-query'
import { getDiscounts } from '../../shared/database'

export function useDiscounts() {
  return useQuery({
    queryKey: ['discounts'],
    queryFn: getDiscounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
