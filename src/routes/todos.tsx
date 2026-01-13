import { createFileRoute } from '@tanstack/react-router'
import { ListTodos } from '@/slices/todos'

export const Route = createFileRoute('/todos')({
  component: ListTodos,
} as const)
