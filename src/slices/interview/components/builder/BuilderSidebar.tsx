import { useState } from 'react'
import { useBuilderMachine } from '../../machines'
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  FolderOpen,
  Edit2,
  Check,
  X,
} from 'lucide-react'

export function BuilderSidebar() {
  const {
    config,
    selectedCategoryId,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    selectCategory,
  } = useBuilderMachine()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleStartEdit = (categoryId: string, currentTitle: string) => {
    setEditingId(categoryId)
    setEditValue(currentTitle)
  }

  const handleSaveEdit = (categoryId: string) => {
    if (editValue.trim()) {
      updateCategory(categoryId, editValue.trim())
    }
    setEditingId(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleDelete = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Möchten Sie diese Kategorie wirklich löschen?')) {
      deleteCategory(categoryId)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderCategories(draggedIndex, dragOverIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleAddCategory = () => {
    addCategory()
    // Select the newly added category after a brief delay
    setTimeout(() => {
      const lastCategory = config.kategorien[config.kategorien.length - 1]
      if (lastCategory) {
        selectCategory(lastCategory.id)
        handleStartEdit(lastCategory.id, lastCategory.titel)
      }
    }, 50)
  }

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="font-semibold text-gray-700">Kategorien</h2>
        <button
          onClick={handleAddCategory}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-teal-600"
          title="Kategorie hinzufügen"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-auto">
        {config.kategorien.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
            <FolderOpen className="h-12 w-12" />
            <p className="mt-2 text-sm">Keine Kategorien</p>
            <button
              onClick={handleAddCategory}
              className="mt-3 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-4 w-4" />
              Erste Kategorie erstellen
            </button>
          </div>
        ) : (
          <ul className="py-2">
            {config.kategorien.map((category, index) => (
              <li
                key={category.id}
                draggable={editingId !== category.id}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative ${
                  dragOverIndex === index && draggedIndex !== index
                    ? 'border-t-2 border-teal-500'
                    : ''
                }`}
              >
                {editingId === category.id ? (
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(category.id)
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(category.id)}
                      className="rounded p-1 text-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => selectCategory(category.id)}
                    className={`flex w-full items-center gap-2 px-2 py-2 text-left transition-colors ${
                      selectedCategoryId === category.id
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <GripVertical className="h-4 w-4 cursor-grab text-gray-400 opacity-0 group-hover:opacity-100" />
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        selectedCategoryId === category.id ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="flex-1 truncate text-sm">
                      {category.titel}
                    </span>
                    <span className="text-xs text-gray-400">
                      {category.fragen.length}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(category.id, category.titel)
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(category.id, e)}
                        className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Kategorien:</span>
          <span>{config.kategorien.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Fragen gesamt:</span>
          <span>
            {config.kategorien.reduce((sum, k) => sum + k.fragen.length, 0)}
          </span>
        </div>
      </div>
    </aside>
  )
}
