import { useState } from 'react'
import { useBuilderMachine } from '../../machines'
import { Filter, ChevronDown, ChevronUp, Info, Trash2 } from 'lucide-react'

interface ConditionEditorProps {
  bedingung: string
  categoryId: string
  questionId: string
  availableQuestionIds: string[]
}

export function ConditionEditor({
  bedingung,
  categoryId,
  questionId,
  availableQuestionIds,
}: ConditionEditorProps) {
  const { updateQuestion, config } = useBuilderMachine()

  const [isExpanded, setIsExpanded] = useState(!!bedingung)
  const [selectedQuestionId, setSelectedQuestionId] = useState('')
  const [selectedValue, setSelectedValue] = useState('')

  // Parse existing condition
  const parseCondition = (condition: string) => {
    const match = condition.match(/\{(\w+)\}\s*=\s*'([^']+)'/)
    if (match) {
      return { questionId: match[1], value: match[2] }
    }
    return null
  }

  const parsed = bedingung ? parseCondition(bedingung) : null

  // Get question by ID
  const getQuestionById = (id: string) => {
    for (const cat of config.kategorien) {
      const q = cat.fragen.find((f) => f.id === id)
      if (q) return q
    }
    return null
  }

  // Get possible values for a question
  const getPossibleValues = (qId: string): string[] => {
    const question = getQuestionById(qId)
    if (!question) return []

    if (question.typ === 'ja_nein') {
      return ['Ja', 'Nein']
    }
    if (question.typ === 'checkboxen' || question.typ === 'dropdown') {
      return question.optionen || []
    }
    return []
  }

  const handleSetCondition = () => {
    if (!selectedQuestionId || !selectedValue) return
    const newCondition = `{${selectedQuestionId}} = '${selectedValue}'`
    updateQuestion(categoryId, questionId, { bedingung: newCondition })
    setSelectedQuestionId('')
    setSelectedValue('')
  }

  const handleClearCondition = () => {
    updateQuestion(categoryId, questionId, { bedingung: undefined })
  }

  const handleQuestionSelect = (qId: string) => {
    setSelectedQuestionId(qId)
    setSelectedValue('') // Reset value when question changes
  }

  const possibleValues = selectedQuestionId
    ? getPossibleValues(selectedQuestionId)
    : []

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-500" />
          <span className="text-sm font-medium text-gray-700">
            Bedingte Anzeige
          </span>
          {bedingung && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
              Aktiv
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
            <p className="text-xs text-blue-700">
              Mit einer Bedingung wird diese Frage nur angezeigt, wenn eine
              vorherige Frage einen bestimmten Wert hat.
            </p>
          </div>

          {/* Current Condition */}
          {parsed && (
            <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-800">
                  Aktuelle Bedingung:
                </span>
                <button
                  onClick={handleClearCondition}
                  className="rounded p-1 text-purple-600 hover:bg-purple-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-sm text-purple-700">
                Zeige diese Frage nur wenn{' '}
                <code className="rounded bg-purple-200 px-1">
                  {parsed.questionId}
                </code>{' '}
                ={' '}
                <code className="rounded bg-purple-200 px-1">
                  "{parsed.value}"
                </code>
              </p>
            </div>
          )}

          {/* Set New Condition */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Wenn Frage:
              </label>
              <select
                value={selectedQuestionId}
                onChange={(e) => handleQuestionSelect(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
              >
                <option value="">Frage auswählen...</option>
                {availableQuestionIds.map((id) => {
                  const q = getQuestionById(id)
                  return (
                    <option key={id} value={id}>
                      {id}
                      {q ? ` - ${q.text.substring(0, 40)}...` : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {selectedQuestionId && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Den Wert hat:
                </label>
                {possibleValues.length > 0 ? (
                  <select
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
                  >
                    <option value="">Wert auswählen...</option>
                    {possibleValues.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
                    placeholder="Wert eingeben..."
                  />
                )}
              </div>
            )}

            {selectedQuestionId && selectedValue && (
              <button
                onClick={handleSetCondition}
                className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
              >
                Bedingung setzen
              </button>
            )}
          </div>

          {/* Manual Input */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700">
              Oder direkt eingeben:
            </label>
            <input
              type="text"
              value={bedingung}
              onChange={(e) =>
                updateQuestion(categoryId, questionId, {
                  bedingung: e.target.value || undefined,
                })
              }
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
              placeholder="{frage_id} = 'Wert'"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: {'{frage_id}'} = 'Wert'
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
