import { useState } from 'react'
import { useBuilderMachine } from '../../machines'
import { Copy, Check, Download } from 'lucide-react'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'

export function JsonPreview() {
  const { exportConfig, validate, markSaved } = useBuilderMachine()

  const [copied, setCopied] = useState(false)

  const config = exportConfig()
  const jsonString = JSON.stringify(config, null, 2)
  const validationResult = validate()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    if (!validationResult.valid) {
      alert(
        'Bitte beheben Sie zuerst die Validierungsfehler:\n\n' +
          validationResult.errors.map((e) => `- ${e.message}`).join('\n')
      )
      return
    }

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

  return (
    <div className="flex h-full flex-1 flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">interview_config.json</span>
          {validationResult.valid ? (
            <span className="rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
              Gültig
            </span>
          ) : (
            <span className="rounded-full bg-red-900/50 px-2 py-0.5 text-xs text-red-400">
              {validationResult.errors.length} Fehler
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                Kopiert!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Kopieren
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded bg-teal-600 px-3 py-1.5 text-sm text-white hover:bg-teal-700"
          >
            <Download className="h-4 w-4" />
            Herunterladen
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {!validationResult.valid && (
        <div className="border-b border-red-900/50 bg-red-900/20 px-4 py-2">
          <p className="mb-1 text-sm font-medium text-red-400">
            Validierungsfehler:
          </p>
          <ul className="max-h-24 overflow-auto text-xs text-red-300">
            {validationResult.errors.map((error, i) => (
              <li key={i} className="py-0.5">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* JSON Content */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="font-mono text-sm text-gray-300">
          <code>{jsonString}</code>
        </pre>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between border-t border-gray-700 px-4 py-2 text-xs text-gray-500">
        <span>
          {config.kategorien.length} Kategorien,{' '}
          {config.kategorien.reduce((sum, k) => sum + k.fragen.length, 0)} Fragen
        </span>
        <span>{jsonString.length.toLocaleString()} Zeichen</span>
      </div>
    </div>
  )
}
