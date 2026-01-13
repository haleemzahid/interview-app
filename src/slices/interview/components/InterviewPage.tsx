import { useState, useEffect } from 'react'
import { useInterviewMachine } from '../machines'
import { InterviewSidebar } from './InterviewSidebar'
import { PatientInfoForm } from './PatientInfoForm'
import { QuestionView } from './QuestionView'
import { NotesView } from './NotesView'
import { ExportView } from './ExportView'
import { TestsView } from './TestsView'
import type { NavigationTab, InterviewConfig, InterviewSession } from '../types'
import { Upload, FolderOpen, AlertCircle } from 'lucide-react'

// Type for saved data in localStorage
interface SavedSessionData {
  session: InterviewSession
  config: InterviewConfig
}

export function InterviewPage() {
  const {
    config,
    session,
    loadConfig,
    isInterviewing,
    isCompleted,
    resumeSession,
  } = useInterviewMachine()
  const [activeTab, setActiveTab] = useState<NavigationTab>('interview')
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)
  const [recoveredSessionData, setRecoveredSessionData] =
    useState<SavedSessionData | null>(null)

  // Auto-switch to export tab when interview is completed
  useEffect(() => {
    if (isCompleted || session?.status === 'completed') {
      setActiveTab('export')
    }
  }, [isCompleted, session?.status])

  // Check for recovered sessions
  useEffect(() => {
    const lastSessionId = localStorage.getItem('interview-last-session-id')
    if (lastSessionId && !session) {
      const savedData = localStorage.getItem(
        `interview-session-${lastSessionId}`
      )
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData) as SavedSessionData
          // Check if it's the new format (has both session and config)
          if (parsed.session && parsed.config) {
            if (parsed.session.status === 'in_progress') {
              setRecoveredSessionData(parsed)
              setShowRecoveryBanner(true)
            }
          }
        } catch (e) {
          // Invalid saved data, clean up
          localStorage.removeItem(`interview-session-${lastSessionId}`)
          localStorage.removeItem('interview-last-session-id')
        }
      }
    }
  }, [session])

  const handleRecoverSession = () => {
    if (recoveredSessionData) {
      resumeSession(recoveredSessionData.session, recoveredSessionData.config)
      setShowRecoveryBanner(false)
      setRecoveredSessionData(null)
    }
  }

  const handleDismissRecovery = () => {
    if (recoveredSessionData) {
      localStorage.removeItem(
        `interview-session-${recoveredSessionData.session.id}`
      )
      localStorage.removeItem('interview-last-session-id')
    }
    setShowRecoveryBanner(false)
    setRecoveredSessionData(null)
  }

  const handleImportConfig = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const text = await file.text()
          const imported = JSON.parse(text) as InterviewConfig
          // Validate that it has the correct structure
          if (!imported.kategorien || !Array.isArray(imported.kategorien)) {
            throw new Error('Invalid config format')
          }
          loadConfig(imported)
        } catch (err) {
          alert(
            'Fehler beim Importieren. Bitte überprüfen Sie das JSON-Format.'
          )
        }
      }
    }
    input.click()
  }

  const renderContent = () => {
    // If no config loaded, show import option
    if (!config) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <FolderOpen className="mx-auto h-16 w-16 text-gray-300" />
            <h2 className="mt-6 text-xl font-semibold text-gray-700">
              Kein Fragebogen geladen
            </h2>
            <p className="mt-2 text-gray-500">
              Importieren Sie eine JSON-Datei, um zu beginnen
            </p>
            <button
              onClick={handleImportConfig}
              className="mx-auto mt-6 flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Upload className="h-5 w-5" />
              Fragebogen importieren
            </button>
          </div>
        </div>
      )
    }

    // If no session started, show patient form
    if (!isInterviewing && !session) {
      return <PatientInfoForm />
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
        {showRecoveryBanner && recoveredSessionData && (
          <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                Eine vorherige Sitzung wurde gefunden (Patient:{' '}
                {recoveredSessionData.session.patientInfo.firstName}{' '}
                {recoveredSessionData.session.patientInfo.lastName}). Möchten
                Sie sie wiederherstellen?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDismissRecovery}
                className="rounded px-3 py-1 text-sm text-amber-700 hover:bg-amber-100"
              >
                Verwerfen
              </button>
              <button
                onClick={handleRecoverSession}
                className="rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700"
              >
                Sitzung wiederherstellen
              </button>
            </div>
          </div>
        )}

        {/* Import Config Button (when session not active but config loaded) */}
        {!session && config && (
          <div className="flex justify-end border-b border-gray-100 px-4 py-2">
            <button
              onClick={handleImportConfig}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <Upload className="h-4 w-4" />
              Anderen Fragebogen importieren
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </main>
    </div>
  )
}
