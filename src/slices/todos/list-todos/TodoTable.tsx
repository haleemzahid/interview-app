import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  CheckCircle,
  Circle,
  Clock,
  Trash2,
  Edit,
  AlertCircle,
} from 'lucide-react'
import {
  BaseTable,
  SortableHeader,
  TableBadge,
  TableActions,
  TableActionButton,
  type ColumnFilter,
} from '@/core/components'
import type { Todo } from '../shared/types'

interface TodoTableProps {
  todos: Todo[]
  onDelete: (id: number) => void
  onToggleStatus: (id: number) => void
  onEdit: (todo: Todo) => void
}

export default function TodoTable({
  todos,
  onDelete,
  onToggleStatus,
  onEdit,
}: TodoTableProps) {
  const columns = useMemo<ColumnDef<Todo>[]>(
    () => [
      // Status column with icon
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as Todo['status']
          return (
            <div className="flex items-center gap-2">
              {status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : status === 'in-progress' ? (
                <Clock className="w-5 h-5 text-warning" />
              ) : (
                <Circle className="w-5 h-5 text-base-content/30" />
              )}
              <span className="capitalize">{status}</span>
            </div>
          )
        },
        filterFn: 'equals',
      },

      // Title column
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <SortableHeader column={column}>Title</SortableHeader>
        ),
        cell: (info) => (
          <div className="font-semibold text-base-content">
            {info.getValue() as string}
          </div>
        ),
      },

      // Description column
      {
        accessorKey: 'description',
        header: 'Description',
        cell: (info) => {
          const desc = info.getValue() as string | null
          return (
            <div className="text-sm text-base-content/70 max-w-md truncate">
              {desc ?? '-'}
            </div>
          )
        },
      },

      // Priority column with badge
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => {
          const priority = info.getValue() as Todo['priority']
          const variant =
            priority === 'high'
              ? 'error'
              : priority === 'medium'
                ? 'warning'
                : 'info'
          return <TableBadge variant={variant}>{priority}</TableBadge>
        },
        filterFn: 'equals',
      },

      // Due date column
      {
        accessorKey: 'due_date',
        header: ({ column }) => (
          <SortableHeader column={column}>Due Date</SortableHeader>
        ),
        cell: (info) => {
          const date = info.getValue() as string | null
          if (!date) return <span className="text-base-content/50">-</span>

          const dueDate = new Date(date)
          const today = new Date()
          const isOverdue = dueDate < today

          return (
            <div className="flex items-center gap-2">
              {isOverdue && <AlertCircle className="w-4 h-4 text-error" />}
              <span className={isOverdue ? 'text-error' : ''}>
                {new Date(date).toLocaleDateString()}
              </span>
            </div>
          )
        },
      },

      // Actions column
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const todo = row.original
          return (
            <TableActions>
              <TableActionButton
                onClick={() => onToggleStatus(todo.id)}
                title={
                  todo.status === 'completed'
                    ? 'Mark as pending'
                    : 'Mark as completed'
                }
              >
                {todo.status === 'completed' ? (
                  <Circle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
              </TableActionButton>
              <TableActionButton onClick={() => onEdit(todo)} title="Edit">
                <Edit className="w-4 h-4" />
              </TableActionButton>
              <TableActionButton
                onClick={() => onDelete(todo.id)}
                title="Delete"
                variant="error"
              >
                <Trash2 className="w-4 h-4" />
              </TableActionButton>
            </TableActions>
          )
        },
      },
    ],
    [onDelete, onToggleStatus, onEdit]
  )

  const filters: ColumnFilter[] = [
    {
      id: 'status',
      label: 'Filter by Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    {
      id: 'priority',
      label: 'Filter by Priority',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
  ]

  return (
    <BaseTable
      data={todos}
      columns={columns}
      filters={filters}
      emptyMessage="No todos found. Create one to get started!"
      showStats
    />
  )
}
