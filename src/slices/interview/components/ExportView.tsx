import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { useInterviewMachine } from '../machines'
import {
  FileDown,
  Check,
  Copy,
  CheckCircle,
  FileText,
} from 'lucide-react'

export function ExportView() {
  const { session, config, questions, completeInterview } = useInterviewMachine()
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  if (!session || !config) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileDown className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            Führen Sie ein Interview durch, um den Bericht zu exportieren
          </p>
        </div>
      </div>
    )
  }

  // Get unique categories in order
  const kategorien = config.kategorien

  // Generate report content
  const generateReportText = () => {
    const lines: string[] = []

    // Header
    lines.push('='.repeat(60))
    lines.push('KLINISCHER INTERVIEW-BERICHT')
    lines.push('='.repeat(60))
    lines.push('')

    // Patient Information
    lines.push('PATIENTENINFORMATIONEN')
    lines.push('-'.repeat(40))
    lines.push(
      `Name: ${session.patientInfo.firstName} ${session.patientInfo.lastName}`
    )
    if (session.patientInfo.dateOfBirth) {
      lines.push(`Geburtsdatum: ${session.patientInfo.dateOfBirth}`)
    }
    if (session.patientInfo.gender) {
      lines.push(`Geschlecht: ${session.patientInfo.gender}`)
    }
    lines.push('')

    // Interview Details
    lines.push('INTERVIEW-DETAILS')
    lines.push('-'.repeat(40))
    lines.push(`Datum: ${new Date(session.startedAt).toLocaleDateString('de-DE')}`)
    lines.push(`Status: ${session.status === 'completed' ? 'Abgeschlossen' : 'In Bearbeitung'}`)
    lines.push('')

    // Responses by Category
    for (const kategorie of kategorien) {
      const categoryQuestions = questions.filter(
        (q) => q.kategorie === kategorie.titel
      )

      if (categoryQuestions.length === 0) continue

      lines.push('')
      lines.push(kategorie.titel.toUpperCase())
      lines.push('-'.repeat(40))

      for (const question of categoryQuestions) {
        const answer = session.answers[question.id]

        lines.push('')
        lines.push(`F: ${question.text}`)

        if (answer) {
          let displayValue: string

          if (typeof answer.value === 'boolean') {
            displayValue = answer.value ? 'Ja' : 'Nein'
          } else if (Array.isArray(answer.value)) {
            displayValue = answer.value.join(', ')
          } else {
            displayValue = String(answer.value)
          }

          lines.push(`A: ${displayValue}`)

          if (answer.clinicianNotes) {
            lines.push(`Notiz: ${answer.clinicianNotes}`)
          }

          // Check for follow-up answers
          const followUpId = `${question.id}_followup_`
          const followUpAnswers = Object.entries(session.answers).filter(
            ([key]) => key.startsWith(followUpId)
          )

          for (const [, fuAnswer] of followUpAnswers) {
            if (fuAnswer.value) {
              lines.push(`  Nachfrage: ${String(fuAnswer.value)}`)
            }
          }
        } else {
          lines.push('A: [Nicht beantwortet]')
        }
      }
    }

    // Manual Follow-ups
    if (session.manualFollowUps.length > 0) {
      lines.push('')
      lines.push('MANUELLE NACHFRAGEN')
      lines.push('-'.repeat(40))

      for (const followUp of session.manualFollowUps) {
        lines.push(`- ${followUp.text}`)
      }
    }

    // Session Notes
    if (session.notes) {
      lines.push('')
      lines.push('SITZUNGSNOTIZEN')
      lines.push('-'.repeat(40))
      lines.push(session.notes)
    }

    // Footer
    lines.push('')
    lines.push('='.repeat(60))
    lines.push(`Bericht erstellt: ${new Date().toLocaleString('de-DE')}`)
    lines.push('='.repeat(60))

    return lines.join('\n')
  }

  const reportText = generateReportText()

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveAsText = async () => {
    try {
      const defaultFileName = `interview-bericht-${session.patientInfo.lastName}-${new Date().toISOString().split('T')[0]}.txt`

      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [{ name: 'Text-Dateien', extensions: ['txt'] }],
        title: 'Interview-Bericht speichern',
      })

      if (filePath) {
        const encoder = new TextEncoder()
        await writeFile(filePath, encoder.encode(reportText))

        setExportSuccess(true)
        setTimeout(() => setExportSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Speichern fehlgeschlagen:', error)
      alert('Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.')
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - margin * 2
      let yPos = margin

      // Helper to add new page if needed
      const checkNewPage = (height: number) => {
        if (yPos + height > pageHeight - margin) {
          doc.addPage()
          yPos = margin
        }
      }

      // Title
      doc.setFontSize(18)
      doc.setTextColor(13, 148, 136) // Teal color
      doc.text('Klinischer Interview-Bericht', margin, yPos)
      yPos += 12

      // Divider line
      doc.setDrawColor(13, 148, 136)
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 10

      // Patient Info Box
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(margin, yPos, contentWidth, 30, 2, 2, 'F')
      yPos += 7

      doc.setFontSize(10)
      doc.setTextColor(55, 65, 81)
      doc.setFont('helvetica', 'bold')
      doc.text(
        `Patient: ${session.patientInfo.firstName} ${session.patientInfo.lastName}`,
        margin + 5,
        yPos
      )
      yPos += 6

      doc.setFont('helvetica', 'normal')
      if (session.patientInfo.dateOfBirth) {
        doc.text(`Geburtsdatum: ${session.patientInfo.dateOfBirth}`, margin + 5, yPos)
        yPos += 5
      }
      doc.text(
        `Interview-Datum: ${new Date(session.startedAt).toLocaleDateString('de-DE')}`,
        margin + 5,
        yPos
      )
      yPos += 15

      // Categories and Questions
      for (const kategorie of kategorien) {
        const categoryQuestions = questions.filter(
          (q) => q.kategorie === kategorie.titel
        )
        if (categoryQuestions.length === 0) continue

        // Category Header
        checkNewPage(15)
        doc.setFontSize(12)
        doc.setTextColor(31, 41, 55)
        doc.setFont('helvetica', 'bold')
        doc.text(kategorie.titel, margin, yPos)
        yPos += 2

        doc.setDrawColor(229, 231, 235)
        doc.setLineWidth(0.3)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 8

        // Questions
        for (const question of categoryQuestions) {
          const answer = session.answers[question.id]

          // Calculate text height
          const questionLines = doc.splitTextToSize(question.text, contentWidth - 10)
          const questionHeight = questionLines.length * 5 + 15

          checkNewPage(questionHeight)

          // Question text
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(55, 65, 81)
          doc.text(questionLines, margin, yPos)
          yPos += questionLines.length * 5 + 3

          // Answer
          doc.setFont('helvetica', 'normal')
          let displayValue = '[Nicht beantwortet]'
          doc.setTextColor(156, 163, 175) // Gray for not answered

          if (answer) {
            doc.setTextColor(13, 148, 136) // Teal for answered

            if (typeof answer.value === 'boolean') {
              displayValue = answer.value ? 'Ja' : 'Nein'
            } else if (Array.isArray(answer.value)) {
              displayValue = answer.value.join(', ')
            } else {
              displayValue = String(answer.value)
            }
          }

          const answerLines = doc.splitTextToSize(displayValue, contentWidth - 10)
          doc.text(answerLines, margin, yPos)
          yPos += answerLines.length * 5

          // Clinician notes
          if (answer?.clinicianNotes) {
            yPos += 2
            doc.setTextColor(107, 114, 128)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'italic')
            const noteLines = doc.splitTextToSize(
              `Notiz: ${answer.clinicianNotes}`,
              contentWidth - 10
            )
            checkNewPage(noteLines.length * 4 + 5)
            doc.text(noteLines, margin, yPos)
            yPos += noteLines.length * 4
          }

          // Follow-up answers
          const followUpId = `${question.id}_followup_`
          const followUpAnswers = Object.entries(session.answers).filter(
            ([key]) => key.startsWith(followUpId)
          )

          for (const [, fuAnswer] of followUpAnswers) {
            if (fuAnswer.value) {
              yPos += 3
              checkNewPage(15)

              doc.setFontSize(9)
              doc.setTextColor(13, 148, 136)
              doc.setFont('helvetica', 'normal')
              const fuLines = doc.splitTextToSize(
                `↳ ${String(fuAnswer.value)}`,
                contentWidth - 15
              )
              doc.text(fuLines, margin + 5, yPos)
              yPos += fuLines.length * 4 + 2
            }
          }

          yPos += 5
        }

        yPos += 5
      }

      // Session Notes
      if (session.notes) {
        checkNewPage(20)

        doc.setFontSize(12)
        doc.setTextColor(31, 41, 55)
        doc.setFont('helvetica', 'bold')
        doc.text('Sitzungsnotizen', margin, yPos)
        yPos += 2

        doc.setDrawColor(229, 231, 235)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 8

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(55, 65, 81)
        const noteLines = doc.splitTextToSize(session.notes, contentWidth)
        checkNewPage(noteLines.length * 5 + 10)
        doc.text(noteLines, margin, yPos)
        yPos += noteLines.length * 5 + 10
      }

      // Footer
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(156, 163, 175)
        doc.text(
          `Erstellt: ${new Date().toLocaleString('de-DE')} | Seite ${i} von ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }

      // Ask user where to save the PDF
      const defaultFileName = `interview-bericht-${session.patientInfo.lastName}-${new Date().toISOString().split('T')[0]}.pdf`

      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [{ name: 'PDF-Dateien', extensions: ['pdf'] }],
        title: 'Interview-Bericht als PDF speichern',
      })

      if (filePath) {
        const pdfOutput = doc.output('arraybuffer')
        await writeFile(filePath, new Uint8Array(pdfOutput))

        setExportSuccess(true)
        setTimeout(() => setExportSuccess(false), 3000)
      }
    } catch (error) {
      console.error('PDF-Export fehlgeschlagen:', error)
      alert('PDF-Export fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCompleteInterview = () => {
    if (
      window.confirm(
        'Sind Sie sicher, dass Sie das Interview als abgeschlossen markieren möchten? Diese Aktion kann nicht rückgängig gemacht werden.'
      )
    ) {
      completeInterview()
    }
  }

  // Count answered questions
  const answeredCount = questions.filter((q) => session.answers[q.id]).length

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-4">
        <h2 className="text-xl font-semibold text-gray-800">Export / Bericht</h2>
        <p className="text-sm text-gray-500">
          Überprüfen und exportieren Sie den Interview-Bericht
        </p>
      </div>

      {/* Summary Cards */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Fragen beantwortet</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800">
              {answeredCount} / {questions.length}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Nachfragen hinzugefügt</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800">
              {session.manualFollowUps.length}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Sitzungsdauer</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800">
              {Math.round(
                (new Date().getTime() - new Date(session.startedAt).getTime()) /
                  60000
              )}{' '}
              Min.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Status</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 capitalize">
              {session.status === 'completed' ? 'Abgeschlossen' : 'In Bearbeitung'}
            </p>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Bericht-Vorschau</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Kopieren
                  </>
                )}
              </button>
            </div>
          </div>

          <pre className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-6 font-mono text-sm text-gray-700">
            {reportText}
          </pre>
        </div>
      </div>

      {/* Export Success Message */}
      {exportSuccess && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg">
          <Check className="h-5 w-5" />
          Datei erfolgreich gespeichert!
        </div>
      )}

      {/* Actions Footer */}
      <div className="border-t border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {session.status === 'completed' ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Interview abgeschlossen
              </span>
            ) : (
              <span>{questions.length - answeredCount} Fragen verbleibend</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {session.status !== 'completed' && (
              <button
                onClick={handleCompleteInterview}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Als abgeschlossen markieren
              </button>
            )}

            <button
              onClick={handleSaveAsText}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Als Text speichern
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              <FileDown className="h-5 w-5" />
              {isExporting ? 'PDF wird erstellt...' : 'Als PDF exportieren'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
