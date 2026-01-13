import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import { createActor } from 'xstate'
import { interviewMachine, type InterviewContext } from './interview-machine'
import type {
  Question,
  Questionnaire,
  Answer,
  PatientInfo,
  ManualFollowUp,
  InterviewProgress,
} from '../types'

// =============================================================================
// Types
// =============================================================================

interface InterviewMachineContextValue {
  // Selectors
  questionnaire: Questionnaire | null
  session: InterviewContext['session']
  currentQuestion: Question | null
  isInFollowUp: boolean
  progress: InterviewProgress
  isInterviewing: boolean
  isCompleted: boolean
  isPaused: boolean

  // Actions
  loadQuestionnaire: (questionnaire: Questionnaire) => void
  startSession: (patientInfo: PatientInfo) => void
  resumeSession: (session: InterviewContext['session']) => void
  answerQuestion: (answer: Answer) => void
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

  // Get current question
  const getCurrentQuestion = (): Question | null => {
    const context = state.context
    if (!context.questionnaire) return null

    if (context.isInFollowUp && context.activeFollowUps.length > 0) {
      const followUpId = context.activeFollowUps[context.currentFollowUpIndex]
      return (
        context.questionnaire.questions.find((q: Question) => q.id === followUpId) || null
      )
    }

    const mainQuestions = context.questionnaire.questions.filter(
      (q: Question) => !q.isFollowUp
    )
    return mainQuestions[context.currentQuestionIndex] || null
  }

  // Calculate progress
  const getProgress = (): InterviewProgress => {
    const context = state.context
    if (!context.questionnaire || !context.session) {
      return { current: 0, total: 0, percentage: 0, answeredCount: 0 }
    }

    const mainQuestions = context.questionnaire.questions.filter(
      (q: Question) => !q.isFollowUp
    )
    const total = mainQuestions.length
    const current = context.currentQuestionIndex + 1
    const answeredCount = Object.keys(context.session.answers).length

    return {
      current,
      total,
      percentage: Math.round((current / total) * 100),
      answeredCount,
    }
  }

  const value: InterviewMachineContextValue = {
    // Selectors
    questionnaire: state.context.questionnaire,
    session: state.context.session,
    currentQuestion: getCurrentQuestion(),
    isInFollowUp: state.context.isInFollowUp,
    progress: getProgress(),
    isInterviewing: state.matches('interviewing'),
    isCompleted: state.matches('completed'),
    isPaused: state.matches('paused'),

    // Actions
    loadQuestionnaire: (questionnaire) =>
      actor.send({ type: 'LOAD_QUESTIONNAIRE', questionnaire }),
    startSession: (patientInfo) =>
      actor.send({ type: 'START_SESSION', patientInfo }),
    resumeSession: (session) => {
      if (session) actor.send({ type: 'RESUME_SESSION', session })
    },
    answerQuestion: (answer) => actor.send({ type: 'ANSWER_QUESTION', answer }),
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
