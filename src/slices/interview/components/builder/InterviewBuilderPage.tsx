import { useState } from 'react'
import { useBuilderMachine } from '../../machines'
import { BuilderSidebar } from './BuilderSidebar'
import { QuestionList } from './QuestionList'
import { QuestionEditor } from './QuestionEditor'
import { JsonPreview } from './JsonPreview'
import type { InterviewConfig } from '../../types'
import {
  Plus,
  Upload,
  Download,
  FileJson,
  AlertTriangle,
  Home,
} from 'lucide-react'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { Link } from '@tanstack/react-router'

export function InterviewBuilderPage() {
  const {
    config,
    selectedCategory,
    selectedQuestion,
    hasUnsavedChanges,
    activeTab,
    importConfig,
    exportConfig,
    addCategory,
    selectCategory,
    markSaved,
    setTab,
    validate,
  } = useBuilderMachine()

  const [showValidation, setShowValidation] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

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
          if (!imported.kategorien || !Array.isArray(imported.kategorien)) {
            throw new Error('Invalid config format')
          }
          importConfig(imported)
          // Auto-select first category
          if (imported.kategorien.length > 0) {
            setTimeout(() => {
              const newConfig = config
              if (newConfig.kategorien.length > 0) {
                selectCategory(newConfig.kategorien[0].id)
              }
            }, 100)
          }
        } catch (err) {
          alert('Fehler beim Importieren. Bitte überprüfen Sie das JSON-Format.')
        }
      }
    }
    input.click()
  }

  const handleExportConfig = async () => {
    // Validate first
    const result = validate()
    if (!result.valid) {
      setValidationErrors(result.errors.map((e) => e.message))
      setShowValidation(true)
      return
    }

    const exportedConfig = exportConfig()
    const jsonString = JSON.stringify(exportedConfig, null, 2)

    try {
      const filePath = await save({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: 'interview_config.json',
      })

      if (filePath) {
        await writeTextFile(filePath, jsonString)
        markSaved()
        alert('Konfiguration erfolgreich exportiert!')
      }
    } catch (err) {
      // Fallback to browser download
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'interview_config.json'
      a.click()
      URL.revokeObjectURL(url)
      markSaved()
    }
  }

  const handleAddCategory = () => {
    addCategory()
    // Select the newly added category
    setTimeout(() => {
      const lastCategory = config.kategorien[config.kategorien.length - 1]
      if (lastCategory) {
        selectCategory(lastCategory.id)
      }
    }, 50)
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar - Categories */}
      <BuilderSidebar />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">
              Interview Builder
            </h1>
            {hasUnsavedChanges && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                Nicht gespeichert
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Home className="h-4 w-4" />
              Zur Interview-App
            </Link>

            <button
              onClick={handleImportConfig}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Upload className="h-4 w-4" />
              Importieren
            </button>

            <button
              onClick={handleExportConfig}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white transition-colors hover:bg-teal-700"
            >
              <Download className="h-4 w-4" />
              Exportieren
            </button>
          </div>
        </header>

        {/* Validation Errors Banner */}
        {showValidation && validationErrors.length > 0 && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="font-medium text-red-800">
                  Validierungsfehler gefunden:
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-red-700">
                  {validationErrors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>... und {validationErrors.length - 5} weitere Fehler</li>
                  )}
                </ul>
              </div>
              <button
                onClick={() => setShowValidation(false)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          <button
            onClick={() => setTab('editor')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'editor'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setTab('json')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'json'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileJson className="h-4 w-4" />
            JSON Vorschau
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === 'editor' ? (
            <>
              {/* Question List */}
              <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white">
                {selectedCategory ? (
                  <QuestionList />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-gray-500">
                    <p>Wählen Sie eine Kategorie aus</p>
                    <p className="mt-1 text-sm">
                      oder erstellen Sie eine neue Kategorie
                    </p>
                    <button
                      onClick={handleAddCategory}
                      className="mt-4 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
                    >
                      <Plus className="h-4 w-4" />
                      Kategorie erstellen
                    </button>
                  </div>
                )}
              </div>

              {/* Question Editor */}
              <div className="flex-1 overflow-auto bg-gray-50 p-6">
                {selectedQuestion ? (
                  <QuestionEditor />
                ) : selectedCategory ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-500">
                    <p>Wählen Sie eine Frage aus</p>
                    <p className="mt-1 text-sm">
                      oder erstellen Sie eine neue Frage in der Kategorie
                    </p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-gray-500">
                    <FileJson className="h-16 w-16 text-gray-300" />
                    <p className="mt-4">Willkommen im Interview Builder</p>
                    <p className="mt-1 text-sm">
                      Importieren Sie eine bestehende Konfiguration oder
                      erstellen Sie eine neue
                    </p>
                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={handleImportConfig}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4" />
                        JSON importieren
                      </button>
                      <button
                        onClick={handleAddCategory}
                        className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
                      >
                        <Plus className="h-4 w-4" />
                        Neue Konfiguration
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <JsonPreview />
          )}
        </div>
      </main>
    </div>
  )
}
