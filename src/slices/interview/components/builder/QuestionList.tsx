import { useState } from 'react'
import { useBuilderMachine } from '../../machines'
import type { FrageTyp } from '../../types'
import {
  Plus,
  Trash2,
  GripVertical,
  Copy,
  ToggleLeft,
  CheckSquare,
  ChevronDown,
  FileText,
  MessageSquare,
} from 'lucide-react'

const typeIcons: Record<FrageTyp, React.ReactNode> = {
  ja_nein: <ToggleLeft className="h-4 w-4" />,
  checkboxen: <CheckSquare className="h-4 w-4" />,
  dropdown: <ChevronDown className="h-4 w-4" />,
  textarea: <FileText className="h-4 w-4" />,
}

const typeLabels: Record<FrageTyp, string> = {
  ja_nein: 'Ja/Nein',
  checkboxen: 'Checkboxen',
  dropdown: 'Dropdown',
  textarea: 'Textfeld',
}

export function QuestionList() {
  const {
    selectedCategory,
    selectedCategoryId,
    selectedQuestionId,
    addQuestion,
    deleteQuestion,
    reorderQuestions,
    selectQuestion,
    duplicateQuestion,
  } = useBuilderMachine()

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  if (!selectedCategory || !selectedCategoryId) {
    return null
  }

  const handleAddQuestion = () => {
    addQuestion(selectedCategoryId)
    // Select the new question after a brief delay
    setTimeout(() => {
      if (selectedCategory.fragen.length > 0) {
        const lastQuestion = selectedCategory.fragen[selectedCategory.fragen.length - 1]
        selectQuestion(lastQuestion?.id || null)
      }
    }, 50)
  }

  const handleDelete = (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Möchten Sie diese Frage wirklich löschen?')) {
      deleteQuestion(selectedCategoryId, questionId)
    }
  }

  const handleDuplicate = (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    duplicateQuestion(selectedCategoryId, questionId)
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
      reorderQuestions(selectedCategoryId, draggedIndex, dragOverIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h3 className="font-medium text-gray-700">Fragen</h3>
          <p className="text-xs text-gray-500">{selectedCategory.titel}</p>
        </div>
        <button
          onClick={handleAddQuestion}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-teal-600"
          title="Frage hinzufügen"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Question List */}
      <div className="flex-1 overflow-auto">
        {selectedCategory.fragen.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
            <MessageSquare className="h-10 w-10" />
            <p className="mt-2 text-sm">Keine Fragen</p>
            <button
              onClick={handleAddQuestion}
              className="mt-3 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-4 w-4" />
              Erste Frage erstellen
            </button>
          </div>
        ) : (
          <ul className="py-2">
            {selectedCategory.fragen.map((question, index) => (
              <li
                key={question.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group ${
                  dragOverIndex === index && draggedIndex !== index
                    ? 'border-t-2 border-teal-500'
                    : ''
                }`}
              >
                <button
                  onClick={() => selectQuestion(question.id)}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
                    selectedQuestionId === question.id
                      ? 'bg-teal-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-grab text-gray-400 opacity-0 group-hover:opacity-100" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex-shrink-0 ${
                          selectedQuestionId === question.id
                            ? 'text-teal-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {typeIcons[question.typ]}
                      </span>
                      <code className="truncate text-xs text-gray-500">
                        {question.id}
                      </code>
                    </div>
                    <p
                      className={`mt-1 line-clamp-2 text-sm ${
                        selectedQuestionId === question.id
                          ? 'text-teal-800'
                          : 'text-gray-700'
                      } ${!question.text ? 'italic text-gray-400' : ''}`}
                    >
                      {question.text || 'Kein Text'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          selectedQuestionId === question.id
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {typeLabels[question.typ]}
                      </span>
                      {question.followup &&
                        Object.keys(question.followup).length > 0 && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                            Follow-up
                          </span>
                        )}
                      {question.bedingung && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">
                          Bedingt
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => handleDuplicate(question.id, e)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      title="Duplizieren"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(question.id, e)}
                      className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      title="Löschen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Button Footer */}
      {selectedCategory.fragen.length > 0 && (
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleAddQuestion}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-teal-500 hover:text-teal-600"
          >
            <Plus className="h-4 w-4" />
            Frage hinzufügen
          </button>
        </div>
      )}
    </div>
  )
}
