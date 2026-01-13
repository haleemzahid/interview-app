// useUIControl - Hook to fetch UI control configuration

import { useQuery } from '@tanstack/react-query'
import { getUIControlByName } from '../database/ui-control-queries'

export function useUIControl(configName: string) {
  return useQuery({
    queryKey: ['uiControl', configName],
    queryFn: () => getUIControlByName(configName),
    staleTime: 10 * 60 * 1000, // 10 minutes - UI config rarely changes
    enabled: !!configName,
  })
}
