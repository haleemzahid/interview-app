import { useState, useEffect } from 'react'
import { useInterviewMachine } from '../machines'
import { InterviewSidebar } from './InterviewSidebar'
import { PatientInfoForm } from './PatientInfoForm'
import { QuestionView } from './QuestionView'
import { NotesView } from './NotesView'
import { ExportView } from './ExportView'
import { TestsView } from './TestsView'
import type { NavigationTab, Questionnaire } from '../types'
import { Upload, FolderOpen, AlertCircle } from 'lucide-react'

// Import sample questionnaire
import sampleQuestionnaire from '../data/sample-questionnaire.json'

export function InterviewPage() {
  const {
    questionnaire,
    session,
    loadQuestionnaire,
    isInterviewing,
    resumeSession,
  } = useInterviewMachine()
  const [activeTab, setActiveTab] = useState<NavigationTab>('interview')
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)
  const [recoveredSession, setRecoveredSession] = useState<string | null>(null)

  // Load questionnaire on mount
  useEffect(() => {
    if (!questionnaire) {
      loadQuestionnaire(sampleQuestionnaire as Questionnaire)
    }
  }, [questionnaire, loadQuestionnaire])

  // Check for recovered sessions
  useEffect(() => {
    const lastSessionId = localStorage.getItem('interview-last-session-id')
    if (lastSessionId && !session) {
      const savedSession = localStorage.getItem(
        `interview-session-${lastSessionId}`
      )
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        if (parsed.status === 'in_progress') {
          setRecoveredSession(lastSessionId)
          setShowRecoveryBanner(true)
        }
      }
    }
  }, [session])

  const handleRecoverSession = () => {
    if (recoveredSession) {
      const savedSession = localStorage.getItem(
        `interview-session-${recoveredSession}`
      )
      if (savedSession) {
        resumeSession(JSON.parse(savedSession))
        setShowRecoveryBanner(false)
      }
    }
  }

  const handleDismissRecovery = () => {
    if (recoveredSession) {
      localStorage.removeItem(`interview-session-${recoveredSession}`)
      localStorage.removeItem('interview-last-session-id')
    }
    setShowRecoveryBanner(false)
  }

  const handleImportQuestionnaire = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const text = await file.text()
          const imported = JSON.parse(text) as Questionnaire
          loadQuestionnaire(imported)
        } catch (err) {
          alert('Failed to import questionnaire. Please check the JSON format.')
        }
      }
    }
    input.click()
  }

  const renderContent = () => {
    // If no session started, show patient form or questionnaire selection
    if (!isInterviewing && !session) {
      if (questionnaire) {
        return <PatientInfoForm />
      }

      // No questionnaire loaded - show import option
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <FolderOpen className="mx-auto h-16 w-16 text-gray-300" />
            <h2 className="mt-6 text-xl font-semibold text-gray-700">
              No Questionnaire Loaded
            </h2>
            <p className="mt-2 text-gray-500">
              Import a questionnaire JSON file to get started
            </p>
            <button
              onClick={handleImportQuestionnaire}
              className="mt-6 flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Upload className="h-5 w-5" />
              Import Questionnaire
            </button>
          </div>
        </div>
      )
    }

    // Show appropriate view based on active tab
    switch (activeTab) {
      case 'interview':
        return <QuestionView />
      case 'tests':
        return <TestsView />
      case 'notes':
        return <NotesView />
      case 'export':
        return <ExportView />
      default:
        return <QuestionView />
    }
  }

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <InterviewSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        {/* Recovery Banner */}
        {showRecoveryBanner && (
          <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                A previous session was found. Would you like to recover it?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDismissRecovery}
                className="rounded px-3 py-1 text-sm text-amber-700 hover:bg-amber-100"
              >
                Dismiss
              </button>
              <button
                onClick={handleRecoverSession}
                className="rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700"
              >
                Recover Session
              </button>
            </div>
          </div>
        )}

        {/* Import Questionnaire Button (when session active) */}
        {!session && questionnaire && (
          <div className="flex justify-end border-b border-gray-100 px-4 py-2">
            <button
              onClick={handleImportQuestionnaire}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <Upload className="h-4 w-4" />
              Import Different Questionnaire
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </main>
    </div>
  )
}
