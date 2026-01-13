import { setup, assign, fromPromise } from 'xstate'
import type {
  InterviewSession,
  Question,
  Questionnaire,
  Answer,
  PatientInfo,
  ManualFollowUp,
} from '../types'

// =============================================================================
// Context Type
// =============================================================================

export interface InterviewContext {
  questionnaire: Questionnaire | null
  session: InterviewSession | null
  currentQuestionIndex: number
  activeFollowUps: string[]
  currentFollowUpIndex: number
  isInFollowUp: boolean
  error: string | null
}

// =============================================================================
// Event Types
// =============================================================================

type InterviewEvent =
  | { type: 'LOAD_QUESTIONNAIRE'; questionnaire: Questionnaire }
  | { type: 'START_SESSION'; patientInfo: PatientInfo }
  | { type: 'RESUME_SESSION'; session: InterviewSession }
  | { type: 'ANSWER_QUESTION'; answer: Answer }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'SKIP_FOLLOW_UP' }
  | { type: 'ADD_MANUAL_FOLLOW_UP'; followUp: ManualFollowUp }
  | { type: 'UPDATE_NOTES'; notes: string }
  | { type: 'COMPLETE_INTERVIEW' }
  | { type: 'PAUSE_INTERVIEW' }
  | { type: 'AUTOSAVE' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_FAILURE'; error: string }
  | { type: 'GO_TO_QUESTION'; index: number }

// =============================================================================
// Helper Functions
// =============================================================================

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getMainQuestions(questionnaire: Questionnaire): Question[] {
  return questionnaire.questions.filter((q) => !q.isFollowUp)
}

function evaluateFollowUpCondition(
  condition: string,
  answer: Answer['value']
): boolean {
  const answerStr = String(answer).toLowerCase()
  const conditionLower = condition.toLowerCase()

  // Yes/No condition
  if (conditionLower === 'yes' || conditionLower === 'no') {
    return answerStr === conditionLower || answer === (conditionLower === 'yes')
  }

  // Numeric comparison
  if (conditionLower.startsWith('>')) {
    const threshold = parseFloat(conditionLower.slice(1))
    return typeof answer === 'number' && answer > threshold
  }
  if (conditionLower.startsWith('<')) {
    const threshold = parseFloat(conditionLower.slice(1))
    return typeof answer === 'number' && answer < threshold
  }
  if (conditionLower.startsWith('>=')) {
    const threshold = parseFloat(conditionLower.slice(2))
    return typeof answer === 'number' && answer >= threshold
  }
  if (conditionLower.startsWith('<=')) {
    const threshold = parseFloat(conditionLower.slice(2))
    return typeof answer === 'number' && answer <= threshold
  }

  // Contains condition
  if (conditionLower.startsWith('contains:')) {
    const searchTerm = conditionLower.slice(9)
    return answerStr.includes(searchTerm)
  }

  // Exact match
  return answerStr === conditionLower
}

function getTriggeredFollowUps(
  question: Question,
  answer: Answer['value']
): string[] {
  if (!question.followUpRules) return []

  const triggeredIds: string[] = []
  for (const rule of question.followUpRules) {
    if (evaluateFollowUpCondition(rule.condition, answer)) {
      triggeredIds.push(...rule.followUpIds)
    }
  }
  return triggeredIds
}

// =============================================================================
// Actors
// =============================================================================

const saveSession = fromPromise<void, { session: InterviewSession }>(
  async ({ input }) => {
    // Save to localStorage for crash recovery
    localStorage.setItem(
      `interview-session-${input.session.id}`,
      JSON.stringify(input.session)
    )
    localStorage.setItem('interview-last-session-id', input.session.id)
    // Simulate async save (can be extended to save to database)
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
)

// =============================================================================
// Machine Definition
// =============================================================================

export const interviewMachine = setup({
  types: {
    context: {} as InterviewContext,
    events: {} as InterviewEvent,
  },
  actors: {
    saveSession,
  },
  guards: {
    hasNextQuestion: ({ context }) => {
      if (!context.questionnaire || !context.session) return false

      // If in follow-up mode, check if more follow-ups
      if (context.isInFollowUp) {
        return context.currentFollowUpIndex < context.activeFollowUps.length - 1
      }

      // Check if more main questions
      const mainQuestions = getMainQuestions(context.questionnaire)
      return context.currentQuestionIndex < mainQuestions.length - 1
    },
    hasPrevQuestion: ({ context }) => {
      // If in follow-up mode, can go back to parent or previous follow-up
      if (context.isInFollowUp) {
        return true
      }
      return context.currentQuestionIndex > 0
    },
    hasActiveFollowUps: ({ context }) => {
      return context.activeFollowUps.length > 0
    },
    isLastQuestion: ({ context }) => {
      if (!context.questionnaire) return false
      const mainQuestions = getMainQuestions(context.questionnaire)
      return (
        context.currentQuestionIndex === mainQuestions.length - 1 &&
        !context.isInFollowUp
      )
    },
  },
  actions: {
    loadQuestionnaire: assign({
      questionnaire: ({ event }) => {
        if (event.type !== 'LOAD_QUESTIONNAIRE') return null
        return event.questionnaire
      },
      error: null,
    }),

    createSession: assign({
      session: ({ context, event }) => {
        if (event.type !== 'START_SESSION' || !context.questionnaire)
          return null
        const now = new Date().toISOString()
        return {
          id: generateSessionId(),
          questionnaireId: context.questionnaire.id,
          questionnaireName: context.questionnaire.name,
          patientInfo: event.patientInfo,
          answers: {},
          manualFollowUps: [],
          notes: '',
          currentQuestionIndex: 0,
          status: 'in_progress' as const,
          startedAt: now,
          updatedAt: now,
        }
      },
      currentQuestionIndex: 0,
      activeFollowUps: [],
      currentFollowUpIndex: 0,
      isInFollowUp: false,
    }),

    resumeSession: assign({
      session: ({ event }) => {
        if (event.type !== 'RESUME_SESSION') return null
        return event.session
      },
      currentQuestionIndex: ({ event }) => {
        if (event.type !== 'RESUME_SESSION') return 0
        return event.session.currentQuestionIndex
      },
    }),

    recordAnswer: assign({
      session: ({ context, event }) => {
        if (event.type !== 'ANSWER_QUESTION' || !context.session) return null
        return {
          ...context.session,
          answers: {
            ...context.session.answers,
            [event.answer.questionId]: event.answer,
          },
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    checkFollowUps: assign({
      activeFollowUps: ({ context, event }) => {
        if (event.type !== 'ANSWER_QUESTION' || !context.questionnaire)
          return []

        const mainQuestions = getMainQuestions(context.questionnaire)
        const currentQuestion = context.isInFollowUp
          ? context.questionnaire.questions.find(
              (q) => q.id === context.activeFollowUps[context.currentFollowUpIndex]
            )
          : mainQuestions[context.currentQuestionIndex]

        if (!currentQuestion) return []

        return getTriggeredFollowUps(currentQuestion, event.answer.value)
      },
      currentFollowUpIndex: 0,
      isInFollowUp: ({ context, event }) => {
        if (event.type !== 'ANSWER_QUESTION' || !context.questionnaire)
          return false

        const mainQuestions = getMainQuestions(context.questionnaire)
        const currentQuestion = mainQuestions[context.currentQuestionIndex]
        if (!currentQuestion) return false

        const followUps = getTriggeredFollowUps(
          currentQuestion,
          event.answer.value
        )
        return followUps.length > 0
      },
    }),

    goToNextQuestion: assign({
      currentQuestionIndex: ({ context }) => {
        if (context.isInFollowUp) {
          // If last follow-up, move to next main question
          if (
            context.currentFollowUpIndex >=
            context.activeFollowUps.length - 1
          ) {
            return context.currentQuestionIndex + 1
          }
          return context.currentQuestionIndex
        }
        return context.currentQuestionIndex + 1
      },
      currentFollowUpIndex: ({ context }) => {
        if (
          context.isInFollowUp &&
          context.currentFollowUpIndex < context.activeFollowUps.length - 1
        ) {
          return context.currentFollowUpIndex + 1
        }
        return 0
      },
      isInFollowUp: ({ context }) => {
        if (context.isInFollowUp) {
          return (
            context.currentFollowUpIndex < context.activeFollowUps.length - 1
          )
        }
        return false
      },
      activeFollowUps: ({ context }) => {
        if (
          context.isInFollowUp &&
          context.currentFollowUpIndex >= context.activeFollowUps.length - 1
        ) {
          return []
        }
        return context.activeFollowUps
      },
      session: ({ context }) => {
        if (!context.session) return null
        const newIndex = context.isInFollowUp
          ? context.currentQuestionIndex
          : context.currentQuestionIndex + 1
        return {
          ...context.session,
          currentQuestionIndex: newIndex,
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    goToPrevQuestion: assign({
      currentQuestionIndex: ({ context }) => {
        if (context.isInFollowUp && context.currentFollowUpIndex === 0) {
          // Go back to main question
          return context.currentQuestionIndex
        }
        if (!context.isInFollowUp && context.currentQuestionIndex > 0) {
          return context.currentQuestionIndex - 1
        }
        return context.currentQuestionIndex
      },
      currentFollowUpIndex: ({ context }) => {
        if (context.isInFollowUp && context.currentFollowUpIndex > 0) {
          return context.currentFollowUpIndex - 1
        }
        return 0
      },
      isInFollowUp: ({ context }) => {
        if (context.isInFollowUp && context.currentFollowUpIndex === 0) {
          return false
        }
        return context.isInFollowUp
      },
      session: ({ context }) => {
        if (!context.session) return null
        return {
          ...context.session,
          currentQuestionIndex: Math.max(0, context.currentQuestionIndex - 1),
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    skipFollowUp: assign({
      currentFollowUpIndex: ({ context }) => {
        if (
          context.isInFollowUp &&
          context.currentFollowUpIndex < context.activeFollowUps.length - 1
        ) {
          return context.currentFollowUpIndex + 1
        }
        return 0
      },
      isInFollowUp: ({ context }) => {
        return (
          context.isInFollowUp &&
          context.currentFollowUpIndex < context.activeFollowUps.length - 1
        )
      },
      activeFollowUps: ({ context }) => {
        if (
          context.isInFollowUp &&
          context.currentFollowUpIndex >= context.activeFollowUps.length - 1
        ) {
          return []
        }
        return context.activeFollowUps
      },
    }),

    addManualFollowUp: assign({
      session: ({ context, event }) => {
        if (event.type !== 'ADD_MANUAL_FOLLOW_UP' || !context.session)
          return null
        return {
          ...context.session,
          manualFollowUps: [...context.session.manualFollowUps, event.followUp],
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    updateNotes: assign({
      session: ({ context, event }) => {
        if (event.type !== 'UPDATE_NOTES' || !context.session) return null
        return {
          ...context.session,
          notes: event.notes,
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    completeSession: assign({
      session: ({ context }) => {
        if (!context.session) return null
        return {
          ...context.session,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    pauseSession: assign({
      session: ({ context }) => {
        if (!context.session) return null
        return {
          ...context.session,
          status: 'paused' as const,
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    goToQuestion: assign({
      currentQuestionIndex: ({ event }) => {
        if (event.type !== 'GO_TO_QUESTION') return 0
        return event.index
      },
      isInFollowUp: false,
      activeFollowUps: [],
      currentFollowUpIndex: 0,
    }),

    setError: assign({
      error: ({ event }) => {
        if (event.type === 'SAVE_FAILURE') return event.error
        return null
      },
    }),

    clearError: assign({
      error: null,
    }),
  },
}).createMachine({
  id: 'interview',
  initial: 'idle',
  context: {
    questionnaire: null,
    session: null,
    currentQuestionIndex: 0,
    activeFollowUps: [],
    currentFollowUpIndex: 0,
    isInFollowUp: false,
    error: null,
  },
  states: {
    idle: {
      on: {
        LOAD_QUESTIONNAIRE: {
          target: 'loaded',
          actions: 'loadQuestionnaire',
        },
      },
    },
    loaded: {
      on: {
        START_SESSION: {
          target: 'interviewing',
          actions: 'createSession',
        },
        RESUME_SESSION: {
          target: 'interviewing',
          actions: 'resumeSession',
        },
      },
    },
    interviewing: {
      initial: 'question',
      on: {
        COMPLETE_INTERVIEW: {
          target: 'completed',
          actions: 'completeSession',
        },
        PAUSE_INTERVIEW: {
          target: 'paused',
          actions: 'pauseSession',
        },
        UPDATE_NOTES: {
          actions: 'updateNotes',
        },
        ADD_MANUAL_FOLLOW_UP: {
          actions: 'addManualFollowUp',
        },
        GO_TO_QUESTION: {
          actions: 'goToQuestion',
        },
      },
      states: {
        question: {
          on: {
            ANSWER_QUESTION: {
              actions: ['recordAnswer', 'checkFollowUps'],
            },
            NEXT_QUESTION: [
              {
                guard: 'hasNextQuestion',
                actions: 'goToNextQuestion',
              },
            ],
            PREV_QUESTION: [
              {
                guard: 'hasPrevQuestion',
                actions: 'goToPrevQuestion',
              },
            ],
            SKIP_FOLLOW_UP: {
              actions: 'skipFollowUp',
            },
            AUTOSAVE: 'saving',
          },
        },
        saving: {
          invoke: {
            src: 'saveSession',
            input: ({ context }) => ({ session: context.session! }),
            onDone: {
              target: 'question',
              actions: 'clearError',
            },
            onError: {
              target: 'question',
              actions: 'setError',
            },
          },
        },
      },
    },
    paused: {
      on: {
        RESUME_SESSION: {
          target: 'interviewing',
          actions: 'resumeSession',
        },
      },
    },
    completed: {
      type: 'final',
    },
  },
})

export type InterviewMachine = typeof interviewMachine
