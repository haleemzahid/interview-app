import { useState } from 'react'
import { useBuilderMachine } from '../../machines'
import type { FrageTyp, FollowUpMap } from '../../types'
import { Plus, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

interface FollowUpEditorProps {
  followup: FollowUpMap
  possibleTriggers: string[]
  categoryId: string
  questionId: string
  questionType: FrageTyp
}

export function FollowUpEditor({
  followup,
  possibleTriggers,
  categoryId,
  questionId,
  questionType,
}: FollowUpEditorProps) {
  const { addFollowup, updateFollowup, deleteFollowup } = useBuilderMachine()

  const [isExpanded, setIsExpanded] = useState(Object.keys(followup).length > 0)
  const [newTrigger, setNewTrigger] = useState('')
  const [newText, setNewText] = useState('')

  const existingTriggers = Object.keys(followup)
  const availableTriggers = possibleTriggers.filter(
    (t) => !existingTriggers.includes(t)
  )

  const handleAddFollowup = () => {
    if (!newTrigger || !newText.trim()) return
    addFollowup(categoryId, questionId, newTrigger, newText.trim())
    setNewTrigger('')
    setNewText('')
  }

  const handleUpdateFollowup = (triggerValue: string, text: string) => {
    updateFollowup(categoryId, questionId, triggerValue, text)
  }

  const handleDeleteFollowup = (triggerValue: string) => {
    if (confirm('Möchten Sie diesen Follow-up wirklich löschen?')) {
      deleteFollowup(categoryId, questionId, triggerValue)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">
            Follow-up Fragen
          </span>
          {existingTriggers.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {existingTriggers.length}
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
          <p className="mb-3 text-xs text-gray-500">
            Follow-up Fragen werden angezeigt, wenn der Patient eine bestimmte
            Antwort gibt.
          </p>

          {/* Existing Follow-ups */}
          {existingTriggers.length > 0 && (
            <div className="mb-4 space-y-3">
              {existingTriggers.map((trigger) => (
                <div
                  key={trigger}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-800">
                      Wenn Antwort: "{trigger}"
                    </span>
                    <button
                      onClick={() => handleDeleteFollowup(trigger)}
                      className="rounded p-1 text-amber-600 hover:bg-amber-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={followup[trigger]}
                    onChange={(e) =>
                      handleUpdateFollowup(trigger, e.target.value)
                    }
                    rows={2}
                    className="mt-2 block w-full rounded border border-amber-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                    placeholder="Follow-up Fragetext..."
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add New Follow-up */}
          {availableTriggers.length > 0 || questionType === 'ja_nein' ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-3">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Neuen Follow-up hinzufügen
              </p>
              <div className="flex gap-2">
                <select
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
                >
                  <option value="">Trigger wählen...</option>
                  {(questionType === 'ja_nein'
                    ? ['Ja', 'Nein'].filter((t) => !existingTriggers.includes(t))
                    : availableTriggers
                  ).map((trigger) => (
                    <option key={trigger} value={trigger}>
                      {trigger}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
                  placeholder="Follow-up Fragetext..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddFollowup()
                  }}
                />
                <button
                  onClick={handleAddFollowup}
                  disabled={!newTrigger || !newText.trim()}
                  className="flex items-center gap-1 rounded bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Hinzufügen
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              {questionType === 'checkboxen' || questionType === 'dropdown'
                ? 'Fügen Sie zuerst Optionen hinzu, um Follow-ups zu erstellen.'
                : 'Für diesen Fragetyp sind keine Follow-ups verfügbar.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
