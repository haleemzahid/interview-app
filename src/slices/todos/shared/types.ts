export interface Todo {
  id: number
  title: string
  description: string | null
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface CreateTodoInput {
  title: string
  description?: string
  status?: 'pending' | 'in-progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  status?: 'pending' | 'in-progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
}
