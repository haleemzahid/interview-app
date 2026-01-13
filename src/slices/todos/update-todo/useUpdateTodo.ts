import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTodo } from '../shared/database'
import type { UpdateTodoInput } from '../shared/types'

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTodoInput }) =>
      updateTodo(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
    onError: (error) => {
      console.error('Error updating todo:', error)
    },
  })
}
