import { useState } from 'react'
import { Plus, ListTodo } from 'lucide-react'
import { BaseListPage } from '@/core/components'
import TodoTable from './TodoTable'
import TodoForm from '../create-todo/TodoForm'
import { useListTodos } from './useListTodos'
import { useCreateTodo } from '../create-todo/useCreateTodo'
import { useUpdateTodo } from '../update-todo/useUpdateTodo'
import { useDeleteTodo } from '../delete-todo/useDeleteTodo'
import { useToggleTodoStatus } from '../toggle-todo-status/useToggleTodoStatus'
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../shared/types'

export default function ListTodos() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined)

  // Queries and mutations
  const { data: todos = [], isLoading, error } = useListTodos()
  const createMutation = useCreateTodo()
  const updateMutation = useUpdateTodo()
  const deleteMutation = useDeleteTodo()
  const toggleStatusMutation = useToggleTodoStatus()

  const handleSubmit = async (data: CreateTodoInput | UpdateTodoInput) => {
    if (editingTodo) {
      await updateMutation.mutateAsync({ id: editingTodo.id, data })
    } else {
      await createMutation.mutateAsync(data as CreateTodoInput)
    }
    setIsFormOpen(false)
    setEditingTodo(undefined)
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this todo?')) {
      void deleteMutation.mutate(id)
    }
  }

  const handleToggleStatus = (id: number) => {
    void toggleStatusMutation.mutate(id)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingTodo(undefined)
  }

  const handleCreateNew = () => {
    setEditingTodo(undefined)
    setIsFormOpen(true)
  }

  // Stats calculation
  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.status === 'completed').length,
    inProgress: todos.filter((t) => t.status === 'in-progress').length,
    pending: todos.filter((t) => t.status === 'pending').length,
  }

  return (
    <>
      <BaseListPage
        title="Todos"
        description="Manage your tasks with TanStack Router, Form, and Table"
        actionButton={{
          label: 'New Todo',
          icon: Plus,
          onClick: handleCreateNew,
        }}
        stats={[
          {
            label: 'Total',
            value: stats.total,
            icon: ListTodo,
            color: 'primary',
          },
          {
            label: 'Pending',
            value: stats.pending,
            color: 'base-content',
          },
          {
            label: 'In Progress',
            value: stats.inProgress,
            color: 'warning',
          },
          {
            label: 'Completed',
            value: stats.completed,
            color: 'success',
          },
        ]}
        isLoading={isLoading}
        error={error}
      >
        <TodoTable
          todos={todos}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
        />
      </BaseListPage>

      {/* Todo Form Modal */}
      <TodoForm
        todo={editingTodo}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isOpen={isFormOpen}
      />
    </>
  )
}
