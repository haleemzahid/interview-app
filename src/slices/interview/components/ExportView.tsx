import { useState } from 'react'
import { useInterviewMachine } from '../machines'
import {
  FileDown,
  Check,
  Copy,
  Printer,
  CheckCircle,
} from 'lucide-react'

export function ExportView() {
  const { session, questionnaire, completeInterview } = useInterviewMachine()
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  if (!session || !questionnaire) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileDown className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            Complete an interview to export the report
          </p>
        </div>
      </div>
    )
  }

  // Generate report content
  const generateReportText = () => {
    const lines: string[] = []

    // Header
    lines.push('=' .repeat(60))
    lines.push('CLINICAL INTERVIEW REPORT')
    lines.push('=' .repeat(60))
    lines.push('')

    // Patient Information
    lines.push('PATIENT INFORMATION')
    lines.push('-'.repeat(40))
    lines.push(`Name: ${session.patientInfo.firstName} ${session.patientInfo.lastName}`)
    if (session.patientInfo.dateOfBirth) {
      lines.push(`Date of Birth: ${session.patientInfo.dateOfBirth}`)
    }
    if (session.patientInfo.gender) {
      lines.push(`Gender: ${session.patientInfo.gender}`)
    }
    lines.push('')

    // Interview Details
    lines.push('INTERVIEW DETAILS')
    lines.push('-'.repeat(40))
    lines.push(`Questionnaire: ${questionnaire.name}`)
    lines.push(`Date: ${new Date(session.startedAt).toLocaleDateString()}`)
    lines.push(`Status: ${session.status}`)
    lines.push('')

    // Responses by Category
    const categories = questionnaire.categories.sort((a, b) => a.order - b.order)

    for (const category of categories) {
      const categoryQuestions = questionnaire.questions.filter(
        (q) => q.category === category.id && !q.isFollowUp
      )

      if (categoryQuestions.length === 0) continue

      lines.push('')
      lines.push(category.name.toUpperCase())
      lines.push('-'.repeat(40))

      for (const question of categoryQuestions) {
        const answer = session.answers[question.id]

        lines.push('')
        lines.push(`Q: ${question.text}`)

        if (answer) {
          let displayValue: string

          if (typeof answer.value === 'boolean') {
            displayValue = answer.value ? 'Yes' : 'No'
          } else if (Array.isArray(answer.value)) {
            const options = question.options || []
            displayValue = answer.value
              .map((v) => options.find((o) => o.value === v)?.label || v)
              .join(', ')
          } else if (question.options) {
            const option = question.options.find(
              (o) => o.value === answer.value
            )
            displayValue = option?.label || String(answer.value)
          } else {
            displayValue = String(answer.value)
          }

          lines.push(`A: ${displayValue}`)

          if (answer.clinicianNotes) {
            lines.push(`Note: ${answer.clinicianNotes}`)
          }
        } else {
          lines.push('A: [Not answered]')
        }

        // Check for follow-ups
        const followUps = questionnaire.questions.filter(
          (q) => q.parentQuestionId === question.id
        )

        for (const followUp of followUps) {
          const followUpAnswer = session.answers[followUp.id]
          if (followUpAnswer) {
            lines.push(`  Follow-up: ${followUp.text}`)
            lines.push(`  Response: ${String(followUpAnswer.value)}`)
          }
        }
      }
    }

    // Manual Follow-ups
    if (session.manualFollowUps.length > 0) {
      lines.push('')
      lines.push('MANUAL FOLLOW-UPS')
      lines.push('-'.repeat(40))

      for (const followUp of session.manualFollowUps) {
        lines.push(`- ${followUp.text}`)
      }
    }

    // Session Notes
    if (session.notes) {
      lines.push('')
      lines.push('SESSION NOTES')
      lines.push('-'.repeat(40))
      lines.push(session.notes)
    }

    // Footer
    lines.push('')
    lines.push('=' .repeat(60))
    lines.push(`Report generated: ${new Date().toLocaleString()}`)
    lines.push('=' .repeat(60))

    return lines.join('\n')
  }

  const reportText = generateReportText()

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Interview Report - ${session.patientInfo.firstName} ${session.patientInfo.lastName}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.5;
                padding: 40px;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>${reportText}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)

    // For now, use print dialog which allows saving as PDF
    // In production, you would use a PDF library like jsPDF or html2pdf
    handlePrint()

    setTimeout(() => setIsExporting(false), 1000)
  }

  const handleCompleteInterview = () => {
    if (
      window.confirm(
        'Are you sure you want to mark this interview as complete? This action cannot be undone.'
      )
    ) {
      completeInterview()
    }
  }

  // Count answered questions
  const mainQuestions = questionnaire.questions.filter((q) => !q.isFollowUp)
  const answeredCount = mainQuestions.filter(
    (q) => session.answers[q.id]
  ).length

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-4">
        <h2 className="text-xl font-semibold text-gray-800">Export / Report</h2>
        <p className="text-sm text-gray-500">
          Review and export the interview report
        </p>
      </div>

      {/* Summary Cards */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Questions Answered</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800">
              {answeredCount} / {mainQuestions.length}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Follow-ups Added</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800">
              {session.manualFollowUps.length}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Session Duration</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800">
              {Math.round(
                (new Date().getTime() -
                  new Date(session.startedAt).getTime()) /
                  60000
              )}{' '}
              min
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Status</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 capitalize">
              {session.status.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Report Preview</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>

          <pre className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-6 font-mono text-sm text-gray-700">
            {reportText}
          </pre>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="border-t border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {session.status === 'completed' ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Interview completed
              </span>
            ) : (
              <span>
                {mainQuestions.length - answeredCount} questions remaining
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {session.status !== 'completed' && (
              <button
                onClick={handleCompleteInterview}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Mark as Complete
              </button>
            )}

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              <FileDown className="h-5 w-5" />
              {isExporting ? 'Exporting...' : 'Export as PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
