import { getDatabase } from '../../../core/database/client'
import type { Todo, CreateTodoInput, UpdateTodoInput } from './types'

/**
 * Get all todos
 */
export async function getTodos() {
  const database = await getDatabase()
  const todos = await database.select<Todo[]>(
    'SELECT * FROM todos ORDER BY created_at DESC'
  )
  return todos
}

/**
 * Get todo by ID
 */
export async function getTodoById(id: number) {
  const database = await getDatabase()
  const todos = await database.select<Todo[]>(
    'SELECT * FROM todos WHERE id = $1',
    [id]
  )
  return todos[0] || null
}

/**
 * Create a new todo
 */
export async function createTodo(input: CreateTodoInput) {
  const database = await getDatabase()
  const result = await database.execute(
    `INSERT INTO todos (title, description, status, priority, due_date)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      input.title,
      input.description ?? null,
      input.status ?? 'pending',
      input.priority ?? 'medium',
      input.due_date ?? null,
    ]
  )
  return result
}

/**
 * Update a todo
 */
export async function updateTodo(id: number, input: UpdateTodoInput) {
  const database = await getDatabase()
  const updates: string[] = []
  const values: (string | number)[] = []
  let paramIndex = 1

  if (input.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(input.title)
  }
  if (input.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(input.description)
  }
  if (input.status !== undefined) {
    updates.push(`status = $${paramIndex++}`)
    values.push(input.status)
  }
  if (input.priority !== undefined) {
    updates.push(`priority = $${paramIndex++}`)
    values.push(input.priority)
  }
  if (input.due_date !== undefined) {
    updates.push(`due_date = $${paramIndex++}`)
    values.push(input.due_date)
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(id)

  const result = await database.execute(
    `UPDATE todos SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    values
  )
  return result
}

/**
 * Delete a todo
 */
export async function deleteTodo(id: number) {
  const database = await getDatabase()
  const result = await database.execute('DELETE FROM todos WHERE id = $1', [id])
  return result
}

/**
 * Toggle todo status (pending <-> completed)
 */
export async function toggleTodoStatus(id: number) {
  const todo = await getTodoById(id)
  if (!todo) return null

  const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
  return await updateTodo(id, { status: newStatus })
}
