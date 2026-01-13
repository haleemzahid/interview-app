import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import { createActor } from 'xstate'
import {
  interviewMachine,
  getVisibleQuestions,
  type InterviewContext,
} from './interview-machine'
import type {
  InterviewConfig,
  FlattenedQuestion,
  Answer,
  PatientInfo,
  ManualFollowUp,
  InterviewProgress,
  ActiveFollowUp,
} from '../types'

// =============================================================================
// Types
// =============================================================================

interface InterviewMachineContextValue {
  // Selectors
  config: InterviewConfig | null
  questions: FlattenedQuestion[]
  session: InterviewContext['session']
  currentQuestion: FlattenedQuestion | null
  activeFollowUp: ActiveFollowUp | null
  progress: InterviewProgress
  isInterviewing: boolean
  isCompleted: boolean
  isPaused: boolean
  isLastQuestion: boolean

  // Actions
  loadConfig: (config: InterviewConfig) => void
  startSession: (patientInfo: PatientInfo) => void
  resumeSession: (session: InterviewContext['session'], config: InterviewConfig) => void
  answerQuestion: (answer: Answer) => void
  answerFollowUp: (answer: Answer) => void
  nextQuestion: () => void
  prevQuestion: () => void
  skipFollowUp: () => void
  addManualFollowUp: (followUp: ManualFollowUp) => void
  updateNotes: (notes: string) => void
  completeInterview: () => void
  pauseInterview: () => void
  goToQuestion: (index: number) => void
}

const InterviewMachineContext =
  createContext<InterviewMachineContextValue | null>(null)

// =============================================================================
// Actor Singleton
// =============================================================================

const actor = createActor(interviewMachine)
actor.start()

// =============================================================================
// Provider Component
// =============================================================================

export function InterviewMachineProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Subscribe to actor state changes
  const state = useSyncExternalStore(
    (callback) => {
      const subscription = actor.subscribe(callback)
      return () => subscription.unsubscribe()
    },
    () => actor.getSnapshot()
  )

  // Autosave every 30 seconds while interviewing
  useEffect(() => {
    if (!state.matches('interviewing')) return

    const interval = setInterval(() => {
      actor.send({ type: 'AUTOSAVE' })
    }, 30000)

    return () => clearInterval(interval)
  }, [state])

  // Get visible questions based on current answers
  const getVisibleQuestionsFromContext = (): FlattenedQuestion[] => {
    const context = state.context
    if (!context.session) return context.questions
    return getVisibleQuestions(context.questions, context.session.answers)
  }

  // Get current question
  const getCurrentQuestion = (): FlattenedQuestion | null => {
    const context = state.context
    const visibleQuestions = getVisibleQuestionsFromContext()
    return visibleQuestions[context.currentQuestionIndex] || null
  }

  // Check if on last question
  const checkIsLastQuestion = (): boolean => {
    const context = state.context
    if (!context.session) return false
    if (context.session.activeFollowUp) return false

    const visibleQuestions = getVisibleQuestionsFromContext()
    return context.currentQuestionIndex === visibleQuestions.length - 1
  }

  // Calculate progress
  const getProgress = (): InterviewProgress => {
    const context = state.context
    if (!context.session) {
      return { current: 0, total: 0, percentage: 0, answeredCount: 0 }
    }

    const visibleQuestions = getVisibleQuestionsFromContext()
    const total = visibleQuestions.length
    const current = context.currentQuestionIndex + 1
    const answeredCount = Object.keys(context.session.answers).filter((key) =>
      visibleQuestions.some((q) => q.id === key)
    ).length

    return {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
      answeredCount,
    }
  }

  const value: InterviewMachineContextValue = {
    // Selectors
    config: state.context.config,
    questions: getVisibleQuestionsFromContext(),
    session: state.context.session,
    currentQuestion: getCurrentQuestion(),
    activeFollowUp: state.context.session?.activeFollowUp || null,
    progress: getProgress(),
    isInterviewing: state.matches('interviewing'),
    isCompleted: state.matches('completed'),
    isPaused: state.matches('paused'),
    isLastQuestion: checkIsLastQuestion(),

    // Actions
    loadConfig: (config) => actor.send({ type: 'LOAD_CONFIG', config }),
    startSession: (patientInfo) =>
      actor.send({ type: 'START_SESSION', patientInfo }),
    resumeSession: (session, config) => {
      if (session && config) actor.send({ type: 'RESUME_SESSION', session, config })
    },
    answerQuestion: (answer) => actor.send({ type: 'ANSWER_QUESTION', answer }),
    answerFollowUp: (answer) => actor.send({ type: 'ANSWER_FOLLOW_UP', answer }),
    nextQuestion: () => actor.send({ type: 'NEXT_QUESTION' }),
    prevQuestion: () => actor.send({ type: 'PREV_QUESTION' }),
    skipFollowUp: () => actor.send({ type: 'SKIP_FOLLOW_UP' }),
    addManualFollowUp: (followUp) =>
      actor.send({ type: 'ADD_MANUAL_FOLLOW_UP', followUp }),
    updateNotes: (notes) => actor.send({ type: 'UPDATE_NOTES', notes }),
    completeInterview: () => actor.send({ type: 'COMPLETE_INTERVIEW' }),
    pauseInterview: () => actor.send({ type: 'PAUSE_INTERVIEW' }),
    goToQuestion: (index) => actor.send({ type: 'GO_TO_QUESTION', index }),
  }

  return (
    <InterviewMachineContext.Provider value={value}>
      {children}
    </InterviewMachineContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useInterviewMachine() {
  const context = useContext(InterviewMachineContext)
  if (!context) {
    throw new Error(
      'useInterviewMachine must be used within InterviewMachineProvider'
    )
  }
  return context
}
