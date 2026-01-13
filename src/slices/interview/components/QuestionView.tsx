import { useState, useEffect, useCallback } from 'react'
import { useInterviewMachine } from '../machines'
import type { Question, Answer } from '../types'
import {
  ChevronLeft,
  ChevronRight,
  SkipForward,
  MessageSquare,
} from 'lucide-react'
import { clsx } from 'clsx'

// =============================================================================
// Answer Input Components
// =============================================================================

interface AnswerInputProps {
  question: Question
  value: Answer['value'] | undefined
  onChange: (value: Answer['value']) => void
}

function YesNoInput({ question: _question, value, onChange }: AnswerInputProps) {
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
        Yes
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
        No
      </button>
    </div>
  )
}

function ScaleInput({ question, value, onChange }: AnswerInputProps) {
  const config = question.scaleConfig || { min: 0, max: 10, step: 1 }
  const currentValue = typeof value === 'number' ? value : config.min

  const steps = []
  for (let i = config.min; i <= config.max; i += config.step || 1) {
    steps.push(i)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{config.minLabel || config.min}</span>
        <span>{config.maxLabel || config.max}</span>
      </div>
      <div className="flex gap-2">
        {steps.map((step) => (
          <button
            key={step}
            onClick={() => onChange(step)}
            className={clsx(
              'flex-1 rounded-lg border-2 py-3 text-lg font-medium transition-all',
              currentValue === step
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            {step}
          </button>
        ))}
      </div>
      <div className="text-center">
        <span className="text-2xl font-semibold text-teal-600">
          {currentValue}
        </span>
      </div>
    </div>
  )
}

function TextInput({ question, value, onChange }: AnswerInputProps) {
  return (
    <textarea
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder || 'Enter your response...'}
      rows={4}
      className="w-full rounded-lg border-2 border-gray-200 bg-white p-4 text-lg text-gray-700 transition-colors focus:border-teal-500 focus:outline-none"
    />
  )
}

function NumberInput({ question, value, onChange }: AnswerInputProps) {
  return (
    <input
      type="number"
      value={typeof value === 'number' ? value : ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={question.placeholder || 'Enter a number...'}
      className="w-full rounded-lg border-2 border-gray-200 bg-white p-4 text-lg text-gray-700 transition-colors focus:border-teal-500 focus:outline-none"
    />
  )
}

function SingleChoiceInput({ question, value, onChange }: AnswerInputProps) {
  const options = question.options || []

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.value)}
          className={clsx(
            'flex w-full items-center rounded-lg border-2 px-4 py-3 text-left transition-all',
            value === option.value
              ? 'border-teal-500 bg-teal-50 text-teal-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <span
            className={clsx(
              'mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2',
              value === option.value
                ? 'border-teal-500 bg-teal-500'
                : 'border-gray-300'
            )}
          >
            {value === option.value && (
              <span className="h-2 w-2 rounded-full bg-white" />
            )}
          </span>
          <span className="text-lg">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

function MultiChoiceInput({ question, value, onChange }: AnswerInputProps) {
  const options = question.options || []
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
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value)
        return (
          <button
            key={option.id}
            onClick={() => toggleOption(option.value)}
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
            <span className="text-lg">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function DateInput({ question: _question, value, onChange }: AnswerInputProps) {
  return (
    <input
      type="date"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border-2 border-gray-200 bg-white p-4 text-lg text-gray-700 transition-colors focus:border-teal-500 focus:outline-none"
    />
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
    isInFollowUp,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    skipFollowUp,
    questionnaire,
    completeInterview,
  } = useInterviewMachine()

  const [currentValue, setCurrentValue] = useState<Answer['value'] | undefined>(
    undefined
  )
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
  }, [currentQuestion?.id])

  // Handle value change - only update local state, don't trigger state machine
  const handleValueChange = useCallback((value: Answer['value']) => {
    setCurrentValue(value)
    setValidationError(null)
  }, [])

  // Handle immediate answer (for buttons like Yes/No, scale, choices)
  // These don't need to wait for "Next" button
  const handleImmediateAnswer = useCallback(
    (value: Answer['value']) => {
      setCurrentValue(value)
      setValidationError(null)
      // Only record non-text answers immediately (buttons, choices, etc.)
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

  // Check if current answer is valid
  const isAnswerValid = useCallback(() => {
    if (!currentQuestion?.required) return true
    if (currentValue === undefined || currentValue === null) return false
    if (typeof currentValue === 'string' && currentValue.trim() === '') return false
    if (Array.isArray(currentValue) && currentValue.length === 0) return false
    return true
  }, [currentQuestion, currentValue])

  const handleNext = useCallback(() => {
    // Validate required questions
    if (currentQuestion?.required && !isAnswerValid()) {
      setValidationError('This question is required. Please provide an answer.')
      return
    }

    // Save current answer if modified
    if (currentQuestion && currentValue !== undefined) {
      answerQuestion({
        questionId: currentQuestion.id,
        value: currentValue,
        timestamp: new Date().toISOString(),
        clinicianNotes: clinicianNotes || undefined,
      })
    }
    nextQuestion()
  }, [currentQuestion, currentValue, clinicianNotes, answerQuestion, nextQuestion, isAnswerValid])

  const handlePrev = useCallback(() => {
    prevQuestion()
  }, [prevQuestion])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // Allow Enter to submit in inputs
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleNext()
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
  }, [handleNext, handlePrev])

  if (!currentQuestion) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No question available</p>
      </div>
    )
  }

  // Get category name
  const category = questionnaire?.categories.find(
    (c) => c.id === currentQuestion.category
  )

  // Check if this is the last question
  const isLastQuestion = progress.current >= progress.total && !isInFollowUp

  // Render appropriate input based on answer type
  const renderInput = () => {
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

    switch (currentQuestion.answerType) {
      case 'yes_no':
        return <YesNoInput {...buttonProps} />
      case 'scale':
        return <ScaleInput {...buttonProps} />
      case 'text':
        return <TextInput {...textProps} />
      case 'number':
        return <NumberInput {...textProps} />
      case 'single_choice':
        return <SingleChoiceInput {...buttonProps} />
      case 'multi_choice':
        return <MultiChoiceInput {...buttonProps} />
      case 'date':
        return <DateInput {...textProps} />
      default:
        return <TextInput {...textProps} />
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with progress */}
      <div className="flex items-center justify-between border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-3">
          {category && (
            <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
              {category.name}
            </span>
          )}
          {isInFollowUp && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              Follow-up
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
          <h2 className="mb-2 text-2xl font-medium text-gray-800">
            {currentQuestion.text}
          </h2>

          {/* Help text */}
          {currentQuestion.helpText && (
            <p className="mb-8 text-gray-500">{currentQuestion.helpText}</p>
          )}

          {/* Required indicator */}
          {currentQuestion.required && (
            <p className="mb-4 text-sm text-red-500">* Required</p>
          )}

          {/* Validation error */}
          {validationError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validationError}
            </div>
          )}

          {/* Answer input */}
          <div className="mb-8">{renderInput()}</div>

          {/* Clinician notes toggle */}
          <button
            onClick={() => setShowNotesPanel(!showNotesPanel)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <MessageSquare className="h-4 w-4" />
            {showNotesPanel ? 'Hide notes' : 'Add clinician note'}
          </button>

          {/* Clinician notes panel */}
          {showNotesPanel && (
            <div className="mt-4">
              <textarea
                value={clinicianNotes}
                onChange={(e) => setClinicianNotes(e.target.value)}
                placeholder="Internal notes (not included in patient report)..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between border-t border-gray-200 px-8 py-4">
        <button
          onClick={handlePrev}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {isInFollowUp && (
            <button
              onClick={skipFollowUp}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-500 transition-colors hover:bg-gray-100"
            >
              <SkipForward className="h-4 w-4" />
              Skip Follow-up
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
