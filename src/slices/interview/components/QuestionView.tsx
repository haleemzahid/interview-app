import { useState, useEffect, useCallback } from 'react'
import { useInterviewMachine } from '../machines'
import type { FlattenedQuestion, Answer } from '../types'
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { clsx } from 'clsx'

// =============================================================================
// Answer Input Components
// =============================================================================

interface AnswerInputProps {
  question: FlattenedQuestion
  value: Answer['value'] | undefined
  onChange: (value: Answer['value']) => void
}

function JaNeinInput({ value, onChange }: AnswerInputProps) {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onChange(true)}
        className={clsx(
          'flex-1 rounded-lg border-2 px-6 py-4 text-lg font-medium transition-all',
          value === true
            ? 'border-teal-500 bg-teal-50 text-teal-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        Ja
      </button>
      <button
        onClick={() => onChange(false)}
        className={clsx(
          'flex-1 rounded-lg border-2 px-6 py-4 text-lg font-medium transition-all',
          value === false
            ? 'border-teal-500 bg-teal-50 text-teal-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        Nein
      </button>
    </div>
  )
}

function CheckboxenInput({ question, value, onChange }: AnswerInputProps) {
  const optionen = question.optionen || []
  const selectedValues = Array.isArray(value) ? value : []

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue))
    } else {
      onChange([...selectedValues, optionValue])
    }
  }

  return (
    <div className="space-y-2">
      {optionen.map((option) => {
        const isSelected = selectedValues.includes(option)
        return (
          <button
            key={option}
            onClick={() => toggleOption(option)}
            className={clsx(
              'flex w-full items-center rounded-lg border-2 px-4 py-3 text-left transition-all',
              isSelected
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <span
              className={clsx(
                'mr-3 flex h-5 w-5 items-center justify-center rounded border-2',
                isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
              )}
            >
              {isSelected && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            <span className="text-lg">{option}</span>
          </button>
        )
      })}
    </div>
  )
}

function DropdownInput({ question, value, onChange }: AnswerInputProps) {
  const optionen = question.optionen || []

  return (
    <div className="space-y-2">
      {optionen.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={clsx(
            'flex w-full items-center rounded-lg border-2 px-4 py-3 text-left transition-all',
            value === option
              ? 'border-teal-500 bg-teal-50 text-teal-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <span
            className={clsx(
              'mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2',
              value === option
                ? 'border-teal-500 bg-teal-500'
                : 'border-gray-300'
            )}
          >
            {value === option && (
              <span className="h-2 w-2 rounded-full bg-white" />
            )}
          </span>
          <span className="text-lg">{option}</span>
        </button>
      ))}
    </div>
  )
}

function TextareaInput({ value, onChange }: AnswerInputProps) {
  return (
    <textarea
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Bitte geben Sie Ihre Antwort ein..."
      rows={4}
      className="w-full rounded-lg border-2 border-gray-200 bg-white p-4 text-lg text-gray-700 transition-colors focus:border-teal-500 focus:outline-none"
    />
  )
}

// Follow-up input component
interface FollowUpInputProps {
  text: string
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onSkip: () => void
}

function FollowUpInput({
  text,
  value,
  onChange,
  onSubmit,
  onSkip,
}: FollowUpInputProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
        <p className="mb-4 text-lg font-medium text-amber-800">{text}</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Bitte geben Sie Ihre Antwort ein..."
          rows={3}
          className="w-full rounded-lg border-2 border-amber-200 bg-white p-4 text-lg text-gray-700 transition-colors focus:border-teal-500 focus:outline-none"
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onSkip}
          className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
        >
          Überspringen
        </button>
        <button
          onClick={onSubmit}
          className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white transition-colors hover:bg-teal-700"
        >
          Weiter
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// Main Question View Component
// =============================================================================

export function QuestionView() {
  const {
    currentQuestion,
    session,
    progress,
    activeFollowUp,
    answerQuestion,
    answerFollowUp,
    nextQuestion,
    prevQuestion,
    skipFollowUp,
    completeInterview,
    isLastQuestion,
  } = useInterviewMachine()

  const [currentValue, setCurrentValue] = useState<Answer['value'] | undefined>(
    undefined
  )
  const [followUpValue, setFollowUpValue] = useState('')
  const [clinicianNotes, setClinicianNotes] = useState('')
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Load existing answer when question changes
  useEffect(() => {
    if (currentQuestion && session?.answers[currentQuestion.id]) {
      setCurrentValue(session.answers[currentQuestion.id].value)
      setClinicianNotes(session.answers[currentQuestion.id].clinicianNotes || '')
    } else {
      setCurrentValue(undefined)
      setClinicianNotes('')
    }
    setValidationError(null)
    setFollowUpValue('')
  }, [currentQuestion?.id, session])

  // Load follow-up answer if exists
  useEffect(() => {
    if (activeFollowUp && session?.answers[activeFollowUp.followUpId]) {
      setFollowUpValue(
        String(session.answers[activeFollowUp.followUpId].value || '')
      )
    } else {
      setFollowUpValue('')
    }
  }, [activeFollowUp, session])

  // Handle value change - only update local state, don't trigger state machine
  const handleValueChange = useCallback((value: Answer['value']) => {
    setCurrentValue(value)
    setValidationError(null)
  }, [])

  // Handle immediate answer (for buttons like Ja/Nein, dropdown, checkboxes)
  const handleImmediateAnswer = useCallback(
    (value: Answer['value']) => {
      setCurrentValue(value)
      setValidationError(null)
      if (currentQuestion) {
        answerQuestion({
          questionId: currentQuestion.id,
          value,
          timestamp: new Date().toISOString(),
          clinicianNotes: clinicianNotes || undefined,
        })
      }
    },
    [currentQuestion, answerQuestion, clinicianNotes]
  )

  // Handle follow-up answer submission
  const handleFollowUpSubmit = useCallback(() => {
    if (activeFollowUp) {
      answerFollowUp({
        questionId: activeFollowUp.followUpId,
        value: followUpValue,
        timestamp: new Date().toISOString(),
      })
      // Move to next question after answering follow-up
      nextQuestion()
    }
  }, [activeFollowUp, followUpValue, answerFollowUp, nextQuestion])

  const handleNext = useCallback(() => {
    // Save current answer if modified (for textarea type)
    if (currentQuestion && currentValue !== undefined) {
      answerQuestion({
        questionId: currentQuestion.id,
        value: currentValue,
        timestamp: new Date().toISOString(),
        clinicianNotes: clinicianNotes || undefined,
      })
    }
    nextQuestion()
  }, [
    currentQuestion,
    currentValue,
    clinicianNotes,
    answerQuestion,
    nextQuestion,
  ])

  const handlePrev = useCallback(() => {
    prevQuestion()
  }, [prevQuestion])

  const handleFinish = useCallback(() => {
    // Save final answer if any
    if (currentQuestion && currentValue !== undefined) {
      answerQuestion({
        questionId: currentQuestion.id,
        value: currentValue,
        timestamp: new Date().toISOString(),
        clinicianNotes: clinicianNotes || undefined,
      })
    }
    completeInterview()
  }, [currentQuestion, currentValue, clinicianNotes, answerQuestion, completeInterview])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // Allow Enter to submit in inputs (with Ctrl/Cmd)
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          if (activeFollowUp) {
            handleFollowUpSubmit()
          } else {
            handleNext()
          }
        }
        return
      }

      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev, handleFollowUpSubmit, activeFollowUp])

  if (!currentQuestion) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Keine Frage verfügbar</p>
      </div>
    )
  }

  // Render appropriate input based on question type
  const renderInput = () => {
    // If there's an active follow-up, show follow-up input
    if (activeFollowUp) {
      return (
        <FollowUpInput
          text={activeFollowUp.followUpText}
          value={followUpValue}
          onChange={setFollowUpValue}
          onSubmit={handleFollowUpSubmit}
          onSkip={skipFollowUp}
        />
      )
    }

    // Text-based inputs use handleValueChange (local state only)
    const textProps: AnswerInputProps = {
      question: currentQuestion,
      value: currentValue,
      onChange: handleValueChange,
    }

    // Button-based inputs use handleImmediateAnswer (triggers state machine)
    const buttonProps: AnswerInputProps = {
      question: currentQuestion,
      value: currentValue,
      onChange: handleImmediateAnswer,
    }

    switch (currentQuestion.typ) {
      case 'ja_nein':
        return <JaNeinInput {...buttonProps} />
      case 'checkboxen':
        return <CheckboxenInput {...buttonProps} />
      case 'dropdown':
        return <DropdownInput {...buttonProps} />
      case 'textarea':
        return <TextareaInput {...textProps} />
      default:
        return <TextareaInput {...textProps} />
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with progress */}
      <div className="flex items-center justify-between border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
            {currentQuestion.kategorie}
          </span>
          {activeFollowUp && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              Nachfrage
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {progress.current} / {progress.total}
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 overflow-y-auto px-8 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Question text */}
          <h2 className="mb-8 text-2xl font-medium text-gray-800">
            {currentQuestion.text}
          </h2>

          {/* Validation error */}
          {validationError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError}
            </div>
          )}

          {/* Answer input */}
          <div className="mb-8">{renderInput()}</div>

          {/* Clinician notes toggle - only show when not in follow-up */}
          {!activeFollowUp && (
            <>
              <button
                onClick={() => setShowNotesPanel(!showNotesPanel)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <MessageSquare className="h-4 w-4" />
                {showNotesPanel ? 'Notizen ausblenden' : 'Notiz hinzufügen'}
              </button>

              {/* Clinician notes panel */}
              {showNotesPanel && (
                <div className="mt-4">
                  <textarea
                    value={clinicianNotes}
                    onChange={(e) => setClinicianNotes(e.target.value)}
                    placeholder="Interne Notizen (nicht im Patientenbericht enthalten)..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation footer - hide when in follow-up (follow-up has its own buttons) */}
      {!activeFollowUp && (
        <div className="flex items-center justify-between border-t border-gray-200 px-8 py-4">
          <button
            onClick={handlePrev}
            disabled={progress.current === 1}
            className={clsx(
              'flex items-center gap-2 rounded-lg px-4 py-2 transition-colors',
              progress.current === 1
                ? 'cursor-not-allowed text-gray-300'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <ChevronLeft className="h-5 w-5" />
            Zurück
          </button>

          <div className="flex items-center gap-2">
            {isLastQuestion ? (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700"
              >
                Interview beenden
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700"
              >
                Weiter
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
