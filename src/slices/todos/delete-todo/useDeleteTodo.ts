import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTodo } from '../shared/database'

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (error) => {
      console.error('Error deleting todo:', error)
    },
  })
}
