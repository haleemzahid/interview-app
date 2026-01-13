import { setup, assign, fromPromise } from 'xstate'
import type {
  InterviewSession,
  InterviewConfig,
  FlattenedQuestion,
  Answer,
  PatientInfo,
  ManualFollowUp,
  ActiveFollowUp,
} from '../types'

// =============================================================================
// Context Type
// =============================================================================

export interface InterviewContext {
  config: InterviewConfig | null
  questions: FlattenedQuestion[]
  session: InterviewSession | null
  currentQuestionIndex: number
  error: string | null
}

// =============================================================================
// Event Types
// =============================================================================

type InterviewEvent =
  | { type: 'LOAD_CONFIG'; config: InterviewConfig }
  | { type: 'START_SESSION'; patientInfo: PatientInfo }
  | { type: 'RESUME_SESSION'; session: InterviewSession; config: InterviewConfig }
  | { type: 'RESET' }
  | { type: 'ANSWER_QUESTION'; answer: Answer }
  | { type: 'ANSWER_FOLLOW_UP'; answer: Answer }
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

/**
 * Flatten the interview config into a linear list of questions
 */
function flattenConfig(config: InterviewConfig): FlattenedQuestion[] {
  const questions: FlattenedQuestion[] = []

  config.kategorien.forEach((kategorie, kategorieIndex) => {
    kategorie.fragen.forEach((frage) => {
      questions.push({
        ...frage,
        kategorie: kategorie.titel,
        kategorieIndex,
      })
    })
  })

  return questions
}

/**
 * Evaluate if a bedingung (condition) is met based on current answers
 * Format: "{questionId} = 'value'" or "{questionId} = 'value1' OR 'value2'"
 */
function evaluateBedingung(
  bedingung: string,
  answers: Record<string, Answer>
): boolean {
  // Parse the condition: "{sym_konzentration} = 'Ja'"
  const match = bedingung.match(/\{(\w+)\}\s*=\s*'([^']+)'/)
  if (!match) return true // If can't parse, show the question

  const [, questionId, expectedValue] = match
  const answer = answers[questionId]

  if (!answer) return false

  // Handle array answers (checkboxes)
  if (Array.isArray(answer.value)) {
    return answer.value.includes(expectedValue)
  }

  // Handle boolean (ja_nein)
  if (typeof answer.value === 'boolean') {
    return (
      (answer.value && expectedValue === 'Ja') ||
      (!answer.value && expectedValue === 'Nein')
    )
  }

  // String comparison
  return String(answer.value) === expectedValue
}

/**
 * Check if a follow-up should be triggered based on the answer
 */
function checkFollowUpTrigger(
  followup: Record<string, string> | undefined,
  answerValue: Answer['value']
): { triggerValue: string; text: string } | null {
  if (!followup) return null

  // Handle boolean answers
  if (typeof answerValue === 'boolean') {
    const key = answerValue ? 'Ja' : 'Nein'
    if (followup[key]) {
      return { triggerValue: key, text: followup[key] }
    }
    return null
  }

  // Handle array answers (checkboxes) - check if any selected option has a follow-up
  if (Array.isArray(answerValue)) {
    for (const val of answerValue) {
      if (followup[val]) {
        return { triggerValue: val, text: followup[val] }
      }
    }
    return null
  }

  // Handle string answers (dropdown)
  const strValue = String(answerValue)
  if (followup[strValue]) {
    return { triggerValue: strValue, text: followup[strValue] }
  }

  return null
}

/**
 * Get visible questions (respecting bedingung conditions)
 */
function getVisibleQuestions(
  questions: FlattenedQuestion[],
  answers: Record<string, Answer>
): FlattenedQuestion[] {
  return questions.filter((q) => {
    if (!q.bedingung) return true
    return evaluateBedingung(q.bedingung, answers)
  })
}

// =============================================================================
// Actors
// =============================================================================

const saveSession = fromPromise<void, { session: InterviewSession; config: InterviewConfig }>(
  async ({ input }) => {
    // Save both session and config to localStorage for crash recovery
    const saveData = {
      session: input.session,
      config: input.config,
    }
    localStorage.setItem(
      `interview-session-${input.session.id}`,
      JSON.stringify(saveData)
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
      if (!context.session) return false

      // If in follow-up mode, always can proceed (will exit follow-up)
      if (context.session.activeFollowUp) return true

      const visibleQuestions = getVisibleQuestions(
        context.questions,
        context.session.answers
      )
      return context.currentQuestionIndex < visibleQuestions.length - 1
    },
    hasPrevQuestion: ({ context }) => {
      // If in follow-up mode, can go back to parent
      if (context.session?.activeFollowUp) return true
      return context.currentQuestionIndex > 0
    },
    isLastQuestion: ({ context }) => {
      if (!context.session) return false

      // Not last if in follow-up
      if (context.session.activeFollowUp) return false

      const visibleQuestions = getVisibleQuestions(
        context.questions,
        context.session.answers
      )
      return context.currentQuestionIndex === visibleQuestions.length - 1
    },
    isInFollowUp: ({ context }) => {
      return context.session?.activeFollowUp !== null
    },
  },
  actions: {
    loadConfig: assign({
      config: ({ event }) => {
        if (event.type !== 'LOAD_CONFIG') return null
        return event.config
      },
      questions: ({ event }) => {
        if (event.type !== 'LOAD_CONFIG') return []
        return flattenConfig(event.config)
      },
      error: null,
    }),

    createSession: assign({
      session: ({ event }) => {
        if (event.type !== 'START_SESSION') return null
        const now = new Date().toISOString()
        return {
          id: generateSessionId(),
          patientInfo: event.patientInfo,
          answers: {},
          manualFollowUps: [],
          notes: '',
          currentQuestionIndex: 0,
          activeFollowUp: null,
          status: 'in_progress' as const,
          startedAt: now,
          updatedAt: now,
        }
      },
      currentQuestionIndex: 0,
    }),

    resumeSession: assign({
      config: ({ event }) => {
        if (event.type !== 'RESUME_SESSION') return null
        return event.config
      },
      questions: ({ event }) => {
        if (event.type !== 'RESUME_SESSION') return []
        return flattenConfig(event.config)
      },
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

        const visibleQuestions = getVisibleQuestions(
          context.questions,
          context.session.answers
        )
        const currentQuestion = visibleQuestions[context.currentQuestionIndex]

        // Check if this answer triggers a follow-up
        const followUpTrigger = currentQuestion
          ? checkFollowUpTrigger(currentQuestion.followup, event.answer.value)
          : null

        let activeFollowUp: ActiveFollowUp | null = null
        if (followUpTrigger) {
          activeFollowUp = {
            parentQuestionId: currentQuestion.id,
            triggerValue: followUpTrigger.triggerValue,
            followUpText: followUpTrigger.text,
            followUpId: `${currentQuestion.id}_followup_${followUpTrigger.triggerValue}`,
          }
        }

        return {
          ...context.session,
          answers: {
            ...context.session.answers,
            [event.answer.questionId]: event.answer,
          },
          activeFollowUp,
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    recordFollowUpAnswer: assign({
      session: ({ context, event }) => {
        if (event.type !== 'ANSWER_FOLLOW_UP' || !context.session) return null

        return {
          ...context.session,
          answers: {
            ...context.session.answers,
            [event.answer.questionId]: event.answer,
          },
          activeFollowUp: null, // Clear follow-up after answering
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    goToNextQuestion: assign({
      currentQuestionIndex: ({ context }) => {
        if (!context.session) return 0

        // If was in follow-up, stay on same question (follow-up cleared by answer)
        if (context.session.activeFollowUp) {
          return context.currentQuestionIndex
        }

        return context.currentQuestionIndex + 1
      },
      session: ({ context }) => {
        if (!context.session) return null

        const newIndex = context.session.activeFollowUp
          ? context.currentQuestionIndex
          : context.currentQuestionIndex + 1

        return {
          ...context.session,
          currentQuestionIndex: newIndex,
          activeFollowUp: null, // Clear any active follow-up
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    goToPrevQuestion: assign({
      currentQuestionIndex: ({ context }) => {
        if (!context.session) return 0

        // If in follow-up, stay on same question but clear follow-up
        if (context.session.activeFollowUp) {
          return context.currentQuestionIndex
        }

        return Math.max(0, context.currentQuestionIndex - 1)
      },
      session: ({ context }) => {
        if (!context.session) return null

        const newIndex = context.session.activeFollowUp
          ? context.currentQuestionIndex
          : Math.max(0, context.currentQuestionIndex - 1)

        return {
          ...context.session,
          currentQuestionIndex: newIndex,
          activeFollowUp: null,
          updatedAt: new Date().toISOString(),
        }
      },
    }),

    skipFollowUp: assign({
      session: ({ context }) => {
        if (!context.session) return null
        return {
          ...context.session,
          activeFollowUp: null,
          updatedAt: new Date().toISOString(),
        }
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
      session: ({ context, event }) => {
        if (event.type !== 'GO_TO_QUESTION' || !context.session) return null
        return {
          ...context.session,
          activeFollowUp: null,
          currentQuestionIndex: event.index,
          updatedAt: new Date().toISOString(),
        }
      },
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

    resetSession: assign({
      session: null,
      currentQuestionIndex: 0,
      error: null,
    }),

    // Immediate save to localStorage (synchronous)
    saveToLocalStorage: ({ context }) => {
      if (context.session && context.config) {
        const saveData = {
          session: context.session,
          config: context.config,
        }
        localStorage.setItem(
          `interview-session-${context.session.id}`,
          JSON.stringify(saveData)
        )
        localStorage.setItem('interview-last-session-id', context.session.id)
      }
    },
  },
}).createMachine({
  id: 'interview',
  initial: 'idle',
  context: {
    config: null,
    questions: [],
    session: null,
    currentQuestionIndex: 0,
    error: null,
  },
  states: {
    idle: {
      on: {
        LOAD_CONFIG: {
          target: 'loaded',
          actions: 'loadConfig',
        },
        RESUME_SESSION: {
          target: 'interviewing',
          actions: 'resumeSession',
        },
      },
    },
    loaded: {
      on: {
        START_SESSION: {
          target: 'interviewing',
          actions: ['createSession', 'saveToLocalStorage'],
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
        RESET: {
          target: 'loaded',
          actions: 'resetSession',
        },
        UPDATE_NOTES: {
          actions: ['updateNotes', 'saveToLocalStorage'],
        },
        ADD_MANUAL_FOLLOW_UP: {
          actions: ['addManualFollowUp', 'saveToLocalStorage'],
        },
        GO_TO_QUESTION: {
          actions: ['goToQuestion', 'saveToLocalStorage'],
        },
      },
      states: {
        question: {
          on: {
            ANSWER_QUESTION: {
              actions: ['recordAnswer', 'saveToLocalStorage'],
            },
            ANSWER_FOLLOW_UP: {
              actions: ['recordFollowUpAnswer', 'saveToLocalStorage'],
            },
            NEXT_QUESTION: [
              {
                guard: 'hasNextQuestion',
                actions: ['goToNextQuestion', 'saveToLocalStorage'],
              },
            ],
            PREV_QUESTION: [
              {
                guard: 'hasPrevQuestion',
                actions: ['goToPrevQuestion', 'saveToLocalStorage'],
              },
            ],
            SKIP_FOLLOW_UP: {
              actions: ['skipFollowUp', 'saveToLocalStorage'],
            },
            AUTOSAVE: 'saving',
          },
        },
        saving: {
          invoke: {
            src: 'saveSession',
            input: ({ context }) => ({ session: context.session!, config: context.config! }),
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
      on: {
        RESET: {
          target: 'loaded',
          actions: 'resetSession',
        },
      },
    },
  },
})

export type InterviewMachine = typeof interviewMachine

// Export helper for use in components
export { getVisibleQuestions }
