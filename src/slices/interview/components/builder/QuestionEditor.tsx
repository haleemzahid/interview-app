import { useBuilderMachine } from '../../machines'
import type { FrageTyp, DraftFrage } from '../../types'
import { OptionsEditor } from './OptionsEditor'
import { FollowUpEditor } from './FollowUpEditor'
import { ConditionEditor } from './ConditionEditor'
import {
  ToggleLeft,
  CheckSquare,
  ChevronDown,
  FileText,
  AlertCircle,
} from 'lucide-react'

const questionTypes: { value: FrageTyp; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'ja_nein',
    label: 'Ja/Nein',
    icon: <ToggleLeft className="h-5 w-5" />,
    description: 'Einfache Ja/Nein-Frage',
  },
  {
    value: 'checkboxen',
    label: 'Checkboxen',
    icon: <CheckSquare className="h-5 w-5" />,
    description: 'Mehrfachauswahl möglich',
  },
  {
    value: 'dropdown',
    label: 'Dropdown',
    icon: <ChevronDown className="h-5 w-5" />,
    description: 'Einfachauswahl aus Liste',
  },
  {
    value: 'textarea',
    label: 'Textfeld',
    icon: <FileText className="h-5 w-5" />,
    description: 'Freitext-Eingabe',
  },
]

export function QuestionEditor() {
  const {
    selectedQuestion,
    selectedCategoryId,
    selectedQuestionId,
    updateQuestion,
    config,
  } = useBuilderMachine()

  if (!selectedQuestion || !selectedCategoryId || !selectedQuestionId) {
    return null
  }

  const handleUpdate = (updates: Partial<DraftFrage>) => {
    updateQuestion(selectedCategoryId, selectedQuestionId, updates)
  }

  // Get all question IDs for condition reference suggestions
  const allQuestionIds = config.kategorien.flatMap((k) =>
    k.fragen.map((f) => f.id)
  )

  // Check if ID is duplicate
  const isDuplicateId = allQuestionIds.filter((id) => id === selectedQuestion.id).length > 1

  // Get possible trigger values for follow-ups
  const getPossibleTriggerValues = (): string[] => {
    if (selectedQuestion.typ === 'ja_nein') {
      return ['Ja', 'Nein']
    }
    return selectedQuestion.optionen || []
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Question ID */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">
          Frage-ID
        </label>
        <input
          type="text"
          value={selectedQuestion.id}
          onChange={(e) =>
            handleUpdate({ id: e.target.value.replace(/\s/g, '_') })
          }
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            isDuplicateId
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-teal-500 focus:ring-teal-200'
          }`}
          placeholder="eindeutige_frage_id"
        />
        {isDuplicateId && (
          <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            Diese ID wird bereits verwendet
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Eindeutige ID für Referenzen in Bedingungen und Follow-ups
        </p>
      </div>

      {/* Question Text */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">
          Fragetext
        </label>
        <textarea
          value={selectedQuestion.text}
          onChange={(e) => handleUpdate({ text: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
          placeholder="Geben Sie hier den Fragetext ein..."
        />
      </div>

      {/* Question Type */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">
          Fragetyp
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {questionTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleUpdate({ typ: type.value })}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                selectedQuestion.typ === type.value
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span
                className={
                  selectedQuestion.typ === type.value
                    ? 'text-teal-600'
                    : 'text-gray-400'
                }
              >
                {type.icon}
              </span>
              <div>
                <p
                  className={`text-sm font-medium ${
                    selectedQuestion.typ === type.value
                      ? 'text-teal-700'
                      : 'text-gray-700'
                  }`}
                >
                  {type.label}
                </p>
                <p className="text-xs text-gray-500">{type.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Options Editor (for checkbox/dropdown) */}
      {(selectedQuestion.typ === 'checkboxen' ||
        selectedQuestion.typ === 'dropdown') && (
        <OptionsEditor
          options={selectedQuestion.optionen || []}
          categoryId={selectedCategoryId}
          questionId={selectedQuestionId}
        />
      )}

      {/* Follow-up Editor */}
      <FollowUpEditor
        followup={selectedQuestion.followup || {}}
        possibleTriggers={getPossibleTriggerValues()}
        categoryId={selectedCategoryId}
        questionId={selectedQuestionId}
        questionType={selectedQuestion.typ}
      />

      {/* Condition Editor */}
      <ConditionEditor
        bedingung={selectedQuestion.bedingung || ''}
        categoryId={selectedCategoryId}
        questionId={selectedQuestionId}
        availableQuestionIds={allQuestionIds.filter(
          (id) => id !== selectedQuestion.id
        )}
      />
    </div>
  )
}
