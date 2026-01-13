import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTodo } from '../shared/database'

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (error) => {
      console.error('Error creating todo:', error)
    },
  })
}
