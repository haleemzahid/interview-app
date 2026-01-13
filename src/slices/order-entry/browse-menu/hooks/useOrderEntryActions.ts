// useOrderEntryActions hook - Fetch order entry actions from database

import { useQuery } from '@tanstack/react-query'
import { getOrderEntryActions } from '../../shared/database/action-queries'

export function useOrderEntryActions() {
  return useQuery({
    queryKey: ['order-entry-actions'],
    queryFn: getOrderEntryActions,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
