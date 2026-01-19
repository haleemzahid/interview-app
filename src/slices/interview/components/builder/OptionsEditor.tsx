import { useState } from 'react'
import { useBuilderMachine } from '../../machines'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface OptionsEditorProps {
  options: string[]
  categoryId: string
  questionId: string
}

export function OptionsEditor({
  options,
  categoryId,
  questionId,
}: OptionsEditorProps) {
  const { addOption, updateOption, deleteOption, reorderOptions } =
    useBuilderMachine()

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleAddOption = () => {
    addOption(categoryId, questionId)
  }

  const handleUpdateOption = (index: number, value: string) => {
    updateOption(categoryId, questionId, index, value)
  }

  const handleDeleteOption = (index: number) => {
    deleteOption(categoryId, questionId, index)
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
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      reorderOptions(categoryId, questionId, draggedIndex, dragOverIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Optionen
        </label>
        <button
          onClick={handleAddOption}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-teal-600 hover:bg-teal-50"
        >
          <Plus className="h-4 w-4" />
          Option hinzufügen
        </button>
      </div>

      {options.length === 0 ? (
        <div className="mt-3 rounded-lg border-2 border-dashed border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Keine Optionen vorhanden</p>
          <button
            onClick={handleAddOption}
            className="mt-2 text-sm text-teal-600 hover:text-teal-700"
          >
            Erste Option hinzufügen
          </button>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {options.map((option, index) => (
            <li
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-2 ${
                dragOverIndex === index && draggedIndex !== index
                  ? 'border-t-2 border-teal-500'
                  : ''
              }`}
            >
              <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-gray-400" />
              <span className="flex-shrink-0 text-sm text-gray-500">
                {index + 1}.
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleUpdateOption(index, e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
                placeholder="Option eingeben..."
              />
              <button
                onClick={() => handleDeleteOption(index)}
                className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Ziehen Sie Optionen, um sie neu anzuordnen
      </p>
    </div>
  )
}
