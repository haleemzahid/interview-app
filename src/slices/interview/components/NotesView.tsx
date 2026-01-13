import { useState, useEffect } from 'react'
import { useInterviewMachine } from '../machines'
import { Save, FileText } from 'lucide-react'

export function NotesView() {
  const { session, updateNotes } = useInterviewMachine()
  const [notes, setNotes] = useState(session?.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load notes when session changes
  useEffect(() => {
    if (session) {
      setNotes(session.notes || '')
    }
  }, [session?.id])

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!session) return

    const timer = setTimeout(() => {
      if (notes !== session.notes) {
        setIsSaving(true)
        updateNotes(notes)
        setTimeout(() => {
          setIsSaving(false)
          setLastSaved(new Date())
        }, 500)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [notes, session, updateNotes])

  const handleManualSave = () => {
    if (!session) return
    setIsSaving(true)
    updateNotes(notes)
    setTimeout(() => {
      setIsSaving(false)
      setLastSaved(new Date())
    }, 500)
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            Start an interview to add session notes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-8 py-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Session Notes</h2>
          <p className="text-sm text-gray-500">
            Free-form notes for this interview session
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-gray-400">
              Last saved:{' '}
              {lastSaved.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {/* Notes editor */}
      <div className="flex-1 p-8">
        <div className="mx-auto h-full max-w-4xl">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your clinical observations, notes, and thoughts about this interview session...

These notes are for your reference and can include:
- Clinical observations
- Non-verbal cues observed
- Initial impressions
- Questions for follow-up
- Treatment considerations"
            className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-6 text-gray-700 focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t border-gray-200 px-8 py-3">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{notes.length} characters</span>
          <span>Auto-save enabled</span>
        </div>
      </div>
    </div>
  )
}
