import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'

export interface ColumnFilter {
  id: string
  label: string
  type: 'select'
  options: { value: string; label: string }[]
}

interface BaseTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  filters?: ColumnFilter[]
  emptyMessage?: string
  showStats?: boolean
  enableSorting?: boolean
  enableFiltering?: boolean
}

/**
 * Base Table component for consistent table displays across the application.
 * Built on TanStack Table with sorting and filtering support.
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<Todo>[] = [
 *   {
 *     accessorKey: 'title',
 *     header: 'Title',
 *     cell: (info) => <span>{info.getValue()}</span>,
 *   },
 *   {
 *     id: 'actions',
 *     header: 'Actions',
 *     cell: ({ row }) => (
 *       <button onClick={() => handleEdit(row.original)}>Edit</button>
 *     ),
 *   },
 * ]
 *
 * <BaseTable
 *   data={todos}
 *   columns={columns}
 *   filters={[
 *     {
 *       id: 'status',
 *       label: 'Filter by Status',
 *       type: 'select',
 *       options: [
 *         { value: '', label: 'All' },
 *         { value: 'pending', label: 'Pending' },
 *         { value: 'completed', label: 'Completed' },
 *       ],
 *     },
 *   ]}
 *   emptyMessage="No items found"
 *   showStats
 * />
 * ```
 */
export default function BaseTable<TData>({
  data,
  columns,
  filters = [],
  emptyMessage = 'No items found',
  showStats = true,
  enableSorting = true,
  enableFiltering = true,
}: BaseTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex gap-4 flex-wrap">
          {filters.map((filter) => (
            <div key={filter.id} className="form-control">
              <label className="label">
                <span className="label-text">{filter.label}</span>
              </label>
              {filter.type === 'select' && (
                <select
                  className="select select-bordered select-sm"
                  value={
                    (table.getColumn(filter.id)?.getFilterValue() as string) ??
                    ''
                  }
                  onChange={(e) =>
                    table
                      .getColumn(filter.id)
                      ?.setFilterValue(
                        e.target.value !== '' ? e.target.value : undefined
                      )
                  }
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table className="table table-zebra">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <div className="text-base-content/50">{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="text-sm text-base-content/70">
          Showing {table.getFilteredRowModel().rows.length} of {data.length}{' '}
          items
        </div>
      )}
    </div>
  )
}
