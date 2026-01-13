import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleTodoStatus } from '../shared/database'

export function useToggleTodoStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleTodoStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (error) => {
      console.error('Error toggling todo status:', error)
    },
  })
}
