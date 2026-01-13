import { useQuery } from '@tanstack/react-query'
import { getTodos } from '../shared/database'

export function useListTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  })
}
