// useServiceMethods - Hook to fetch service methods from database

import { useQuery } from '@tanstack/react-query'
import { getServiceMethods } from '../../shared/database'

export function useServiceMethods() {
  return useQuery({
    queryKey: ['serviceMethods'],
    queryFn: getServiceMethods,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
