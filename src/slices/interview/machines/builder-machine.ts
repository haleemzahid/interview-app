import { setup, assign } from 'xstate'
import type {
  DraftInterviewConfig,
  DraftKategorie,
  DraftFrage,
  InterviewConfig,
  Kategorie,
  ValidationResult,
  ValidationError,
  BuilderTab,
} from '../types'

// =============================================================================
// Context Type
// =============================================================================

export interface BuilderContext {
  config: DraftInterviewConfig
  selectedCategoryId: string | null
  selectedQuestionId: string | null
  hasUnsavedChanges: boolean
  validationResult: ValidationResult | null
  activeTab: BuilderTab
  error: string | null
}

// =============================================================================
// Event Types
// =============================================================================

type BuilderEvent =
  // Config operations
  | { type: 'NEW_CONFIG' }
  | { type: 'IMPORT_CONFIG'; config: InterviewConfig }
  | { type: 'MARK_SAVED' }
  // Category operations
  | { type: 'ADD_CATEGORY' }
  | { type: 'UPDATE_CATEGORY'; categoryId: string; titel: string }
  | { type: 'DELETE_CATEGORY'; categoryId: string }
  | { type: 'REORDER_CATEGORIES'; fromIndex: number; toIndex: number }
  | { type: 'SELECT_CATEGORY'; categoryId: string | null }
  // Question operations
  | { type: 'ADD_QUESTION'; categoryId: string }
  | { type: 'UPDATE_QUESTION'; categoryId: string; questionId: string; updates: Partial<DraftFrage> }
  | { type: 'DELETE_QUESTION'; categoryId: string; questionId: string }
  | { type: 'REORDER_QUESTIONS'; categoryId: string; fromIndex: number; toIndex: number }
  | { type: 'SELECT_QUESTION'; questionId: string | null }
  | { type: 'DUPLICATE_QUESTION'; categoryId: string; questionId: string }
  // Option operations
  | { type: 'ADD_OPTION'; categoryId: string; questionId: string }
  | { type: 'UPDATE_OPTION'; categoryId: string; questionId: string; optionIndex: number; value: string }
  | { type: 'DELETE_OPTION'; categoryId: string; questionId: string; optionIndex: number }
  | { type: 'REORDER_OPTIONS'; categoryId: string; questionId: string; fromIndex: number; toIndex: number }
  // Follow-up operations
  | { type: 'ADD_FOLLOWUP'; categoryId: string; questionId: string; triggerValue: string; text: string }
  | { type: 'UPDATE_FOLLOWUP'; categoryId: string; questionId: string; triggerValue: string; text: string }
  | { type: 'DELETE_FOLLOWUP'; categoryId: string; questionId: string; triggerValue: string }
  // Navigation
  | { type: 'SET_TAB'; tab: BuilderTab }
  // Validation
  | { type: 'VALIDATE' }
  | { type: 'CLEAR_ERROR' }

// =============================================================================
// Helper Functions
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateQuestionId(categoryTitle: string, existingIds: string[]): string {
  // Extract prefix from category title (first word, lowercase, no numbers)
  const prefix = categoryTitle
    .split(/[\s.]+/)[0]
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 6) || 'q'

  // Find next available number
  let num = 1
  while (existingIds.includes(`${prefix}_q${num}`)) {
    num++
  }
  return `${prefix}_q${num}`
}

function createEmptyCategory(index: number): DraftKategorie {
  return {
    id: generateId(),
    titel: `${index}. NEUE KATEGORIE`,
    fragen: [],
  }
}

function createEmptyQuestion(categoryTitle: string, existingIds: string[]): DraftFrage {
  return {
    id: generateQuestionId(categoryTitle, existingIds),
    text: '',
    typ: 'ja_nein',
  }
}

/**
 * Convert imported InterviewConfig to DraftInterviewConfig
 * Adds internal IDs for categories
 */
function importConfigToDraft(config: InterviewConfig): DraftInterviewConfig {
  return {
    kategorien: config.kategorien.map((kat) => ({
      id: generateId(),
      titel: kat.titel,
      fragen: kat.fragen.map((frage) => ({
        ...frage,
      })),
    })),
  }
}

/**
 * Convert DraftInterviewConfig to InterviewConfig for export
 * Removes internal IDs
 */
export function draftToExportConfig(draft: DraftInterviewConfig): InterviewConfig {
  return {
    kategorien: draft.kategorien.map((kat) => ({
      titel: kat.titel,
      fragen: kat.fragen.map((frage) => {
        const exportFrage: Kategorie['fragen'][0] = {
          id: frage.id,
          text: frage.text,
          typ: frage.typ,
        }
        if (frage.optionen && frage.optionen.length > 0) {
          exportFrage.optionen = frage.optionen
        }
        if (frage.followup && Object.keys(frage.followup).length > 0) {
          exportFrage.followup = frage.followup
        }
        if (frage.bedingung) {
          exportFrage.bedingung = frage.bedingung
        }
        return exportFrage
      }),
    })),
  }
}

/**
 * Validate the draft config
 */
export function validateConfig(config: DraftInterviewConfig): ValidationResult {
  const errors: ValidationError[] = []

  if (config.kategorien.length === 0) {
    errors.push({
      path: 'kategorien',
      message: 'Mindestens eine Kategorie erforderlich',
    })
  }

  const allQuestionIds = new Set<string>()

  config.kategorien.forEach((kat, katIndex) => {
    if (!kat.titel.trim()) {
      errors.push({
        path: `kategorien[${katIndex}].titel`,
        message: 'Kategorietitel erforderlich',
      })
    }

    if (kat.fragen.length === 0) {
      errors.push({
        path: `kategorien[${katIndex}].fragen`,
        message: `Kategorie "${kat.titel}" hat keine Fragen`,
      })
    }

    kat.fragen.forEach((frage, frageIndex) => {
      const basePath = `kategorien[${katIndex}].fragen[${frageIndex}]`

      if (!frage.id.trim()) {
        errors.push({
          path: `${basePath}.id`,
          message: 'Frage-ID erforderlich',
        })
      } else if (allQuestionIds.has(frage.id)) {
        errors.push({
          path: `${basePath}.id`,
          message: `Doppelte Frage-ID: "${frage.id}"`,
        })
      } else {
        allQuestionIds.add(frage.id)
      }

      if (!frage.text.trim()) {
        errors.push({
          path: `${basePath}.text`,
          message: 'Fragetext erforderlich',
        })
      }

      // Check options for checkbox/dropdown types
      if ((frage.typ === 'checkboxen' || frage.typ === 'dropdown') &&
          (!frage.optionen || frage.optionen.length === 0)) {
        errors.push({
          path: `${basePath}.optionen`,
          message: `${frage.typ === 'checkboxen' ? 'Checkboxen' : 'Dropdown'}-Fragen benötigen Optionen`,
        })
      }

      // Check follow-up trigger values exist in options
      if (frage.followup && frage.optionen) {
        Object.keys(frage.followup).forEach((triggerValue) => {
          if (frage.typ !== 'ja_nein' && !frage.optionen!.includes(triggerValue)) {
            errors.push({
              path: `${basePath}.followup`,
              message: `Follow-up Trigger "${triggerValue}" existiert nicht in Optionen`,
            })
          }
        })
      }

      // Validate bedingung references
      if (frage.bedingung) {
        const match = frage.bedingung.match(/\{(\w+)\}/)
        if (match) {
          const referencedId = match[1]
          // Check if referenced question exists (and comes before this question)
          let found = false
          for (const k of config.kategorien) {
            for (const f of k.fragen) {
              if (f.id === referencedId) {
                found = true
                break
              }
              if (f.id === frage.id) break // Stop at current question
            }
            if (found) break
          }
          if (!found) {
            errors.push({
              path: `${basePath}.bedingung`,
              message: `Bedingung referenziert unbekannte Frage: "${referencedId}"`,
            })
          }
        }
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

// =============================================================================
// Machine Definition
// =============================================================================

export const builderMachine = setup({
  types: {
    context: {} as BuilderContext,
    events: {} as BuilderEvent,
  },
  actions: {
    newConfig: assign({
      config: { kategorien: [] },
      selectedCategoryId: null,
      selectedQuestionId: null,
      hasUnsavedChanges: false,
      validationResult: null,
      error: null,
    }),

    importConfig: assign(({ event }) => {
      if (event.type !== 'IMPORT_CONFIG') {
        return {
          config: { kategorien: [] },
          selectedCategoryId: null,
          selectedQuestionId: null,
          hasUnsavedChanges: false,
          validationResult: null,
          error: null,
        }
      }
      const draft = importConfigToDraft(event.config)
      return {
        config: draft,
        selectedCategoryId: draft.kategorien.length > 0 ? draft.kategorien[0].id : null,
        selectedQuestionId: null,
        hasUnsavedChanges: false,
        validationResult: null,
        error: null,
      }
    }),

    markSaved: assign({
      hasUnsavedChanges: false,
    }),

    addCategory: assign(({ context }) => {
      const newCategory = createEmptyCategory(context.config.kategorien.length + 1)
      return {
        config: {
          kategorien: [...context.config.kategorien, newCategory],
        },
        selectedCategoryId: newCategory.id,
        hasUnsavedChanges: true,
      }
    }),

    updateCategory: assign({
      config: ({ context, event }) => {
        if (event.type !== 'UPDATE_CATEGORY') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) =>
            kat.id === event.categoryId ? { ...kat, titel: event.titel } : kat
          ),
        }
      },
      hasUnsavedChanges: true,
    }),

    deleteCategory: assign({
      config: ({ context, event }) => {
        if (event.type !== 'DELETE_CATEGORY') return context.config
        return {
          kategorien: context.config.kategorien.filter((kat) => kat.id !== event.categoryId),
        }
      },
      selectedCategoryId: ({ context, event }) => {
        if (event.type !== 'DELETE_CATEGORY') return context.selectedCategoryId
        if (context.selectedCategoryId === event.categoryId) {
          // Select previous or next category
          const idx = context.config.kategorien.findIndex((k) => k.id === event.categoryId)
          const remaining = context.config.kategorien.filter((k) => k.id !== event.categoryId)
          if (remaining.length === 0) return null
          return remaining[Math.max(0, idx - 1)]?.id || null
        }
        return context.selectedCategoryId
      },
      selectedQuestionId: ({ context, event }) => {
        if (event.type !== 'DELETE_CATEGORY') return context.selectedQuestionId
        if (context.selectedCategoryId === event.categoryId) return null
        return context.selectedQuestionId
      },
      hasUnsavedChanges: true,
    }),

    reorderCategories: assign({
      config: ({ context, event }) => {
        if (event.type !== 'REORDER_CATEGORIES') return context.config
        const { fromIndex, toIndex } = event
        const newKategorien = [...context.config.kategorien]
        const [moved] = newKategorien.splice(fromIndex, 1)
        newKategorien.splice(toIndex, 0, moved)
        return { kategorien: newKategorien }
      },
      hasUnsavedChanges: true,
    }),

    selectCategory: assign({
      selectedCategoryId: ({ event }) => {
        if (event.type !== 'SELECT_CATEGORY') return null
        return event.categoryId
      },
      selectedQuestionId: null,
    }),

    addQuestion: assign({
      config: ({ context, event }) => {
        if (event.type !== 'ADD_QUESTION') return context.config
        const allIds = context.config.kategorien.flatMap((k) => k.fragen.map((f) => f.id))
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            const newQuestion = createEmptyQuestion(kat.titel, allIds)
            return {
              ...kat,
              fragen: [...kat.fragen, newQuestion],
            }
          }),
        }
      },
      selectedQuestionId: ({ context, event }) => {
        if (event.type !== 'ADD_QUESTION') return context.selectedQuestionId
        const allIds = context.config.kategorien.flatMap((k) => k.fragen.map((f) => f.id))
        const category = context.config.kategorien.find((k) => k.id === event.categoryId)
        if (!category) return context.selectedQuestionId
        return generateQuestionId(category.titel, allIds)
      },
      hasUnsavedChanges: true,
    }),

    updateQuestion: assign({
      config: ({ context, event }) => {
        if (event.type !== 'UPDATE_QUESTION') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            return {
              ...kat,
              fragen: kat.fragen.map((frage) => {
                if (frage.id !== event.questionId) return frage
                const updated = { ...frage, ...event.updates }
                // Clear options if switching to non-option type
                if (event.updates.typ && event.updates.typ !== 'checkboxen' && event.updates.typ !== 'dropdown') {
                  delete updated.optionen
                }
                // Initialize options if switching to option type
                if (event.updates.typ && (event.updates.typ === 'checkboxen' || event.updates.typ === 'dropdown')) {
                  if (!updated.optionen) {
                    updated.optionen = []
                  }
                }
                return updated
              }),
            }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    deleteQuestion: assign({
      config: ({ context, event }) => {
        if (event.type !== 'DELETE_QUESTION') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            return {
              ...kat,
              fragen: kat.fragen.filter((f) => f.id !== event.questionId),
            }
          }),
        }
      },
      selectedQuestionId: ({ context, event }) => {
        if (event.type !== 'DELETE_QUESTION') return context.selectedQuestionId
        if (context.selectedQuestionId === event.questionId) return null
        return context.selectedQuestionId
      },
      hasUnsavedChanges: true,
    }),

    reorderQuestions: assign({
      config: ({ context, event }) => {
        if (event.type !== 'REORDER_QUESTIONS') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            const newFragen = [...kat.fragen]
            const [moved] = newFragen.splice(event.fromIndex, 1)
            newFragen.splice(event.toIndex, 0, moved)
            return { ...kat, fragen: newFragen }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    selectQuestion: assign({
      selectedQuestionId: ({ event }) => {
        if (event.type !== 'SELECT_QUESTION') return null
        return event.questionId
      },
    }),

    duplicateQuestion: assign({
      config: ({ context, event }) => {
        if (event.type !== 'DUPLICATE_QUESTION') return context.config
        const allIds = context.config.kategorien.flatMap((k) => k.fragen.map((f) => f.id))
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            const questionIdx = kat.fragen.findIndex((f) => f.id === event.questionId)
            if (questionIdx === -1) return kat
            const original = kat.fragen[questionIdx]
            const duplicate: DraftFrage = {
              ...original,
              id: `${original.id}_copy`,
              text: `${original.text} (Kopie)`,
            }
            // Ensure unique ID
            let copyNum = 1
            while (allIds.includes(duplicate.id)) {
              duplicate.id = `${original.id}_copy${copyNum}`
              copyNum++
            }
            const newFragen = [...kat.fragen]
            newFragen.splice(questionIdx + 1, 0, duplicate)
            return { ...kat, fragen: newFragen }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    addOption: assign({
      config: ({ context, event }) => {
        if (event.type !== 'ADD_OPTION') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            return {
              ...kat,
              fragen: kat.fragen.map((frage) => {
                if (frage.id !== event.questionId) return frage
                return {
                  ...frage,
                  optionen: [...(frage.optionen || []), ''],
                }
              }),
            }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    updateOption: assign({
      config: ({ context, event }) => {
        if (event.type !== 'UPDATE_OPTION') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            return {
              ...kat,
              fragen: kat.fragen.map((frage) => {
                if (frage.id !== event.questionId) return frage
                const newOptionen = [...(frage.optionen || [])]
                newOptionen[event.optionIndex] = event.value
                return { ...frage, optionen: newOptionen }
              }),
            }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    deleteOption: assign({
      config: ({ context, event }) => {
        if (event.type !== 'DELETE_OPTION') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            return {
              ...kat,
              fragen: kat.fragen.map((frage) => {
                if (frage.id !== event.questionId) return frage
                const newOptionen = frage.optionen?.filter((_, i) => i !== event.optionIndex) || []
                // Also remove any follow-up that references this option
                const deletedOption = frage.optionen?.[event.optionIndex]
                let newFollowup = frage.followup
                if (deletedOption && newFollowup && newFollowup[deletedOption]) {
                  newFollowup = { ...newFollowup }
                  delete newFollowup[deletedOption]
                }
                return { ...frage, optionen: newOptionen, followup: newFollowup }
              }),
            }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    reorderOptions: assign({
      config: ({ context, event }) => {
        if (event.type !== 'REORDER_OPTIONS') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            return {
              ...kat,
              fragen: kat.fragen.map((frage) => {
                if (frage.id !== event.questionId) return frage
                const newOptionen = [...(frage.optionen || [])]
                const [moved] = newOptionen.splice(event.fromIndex, 1)
                newOptionen.splice(event.toIndex, 0, moved)
                return { ...frage, optionen: newOptionen }
              }),
            }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    addFollowup: assign({
      config: ({ context, event }) => {
        if (event.type !== 'ADD_FOLLOWUP') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            return {
              ...kat,
              fragen: kat.fragen.map((frage) => {
                if (frage.id !== event.questionId) return frage
                return {
                  ...frage,
                  followup: {
                    ...(frage.followup || {}),
                    [event.triggerValue]: event.text,
                  },
                }
              }),
            }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    updateFollowup: assign({
      config: ({ context, event }) => {
        if (event.type !== 'UPDATE_FOLLOWUP') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            return {
              ...kat,
              fragen: kat.fragen.map((frage) => {
                if (frage.id !== event.questionId) return frage
                return {
                  ...frage,
                  followup: {
                    ...(frage.followup || {}),
                    [event.triggerValue]: event.text,
                  },
                }
              }),
            }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    deleteFollowup: assign({
      config: ({ context, event }) => {
        if (event.type !== 'DELETE_FOLLOWUP') return context.config
        return {
          kategorien: context.config.kategorien.map((kat) => {
            if (kat.id !== event.categoryId) return kat
            return {
              ...kat,
              fragen: kat.fragen.map((frage) => {
                if (frage.id !== event.questionId) return frage
                const newFollowup = { ...(frage.followup || {}) }
                delete newFollowup[event.triggerValue]
                return {
                  ...frage,
                  followup: Object.keys(newFollowup).length > 0 ? newFollowup : undefined,
                }
              }),
            }
          }),
        }
      },
      hasUnsavedChanges: true,
    }),

    setTab: assign({
      activeTab: ({ event }) => {
        if (event.type !== 'SET_TAB') return 'editor'
        return event.tab
      },
    }),

    validate: assign({
      validationResult: ({ context }) => validateConfig(context.config),
    }),

    clearError: assign({
      error: null,
    }),
  },
}).createMachine({
  id: 'builder',
  initial: 'editing',
  context: {
    config: { kategorien: [] },
    selectedCategoryId: null,
    selectedQuestionId: null,
    hasUnsavedChanges: false,
    validationResult: null,
    activeTab: 'editor',
    error: null,
  },
  states: {
    editing: {
      on: {
        NEW_CONFIG: { actions: 'newConfig' },
        IMPORT_CONFIG: { actions: 'importConfig' },
        MARK_SAVED: { actions: 'markSaved' },
        ADD_CATEGORY: { actions: 'addCategory' },
        UPDATE_CATEGORY: { actions: 'updateCategory' },
        DELETE_CATEGORY: { actions: 'deleteCategory' },
        REORDER_CATEGORIES: { actions: 'reorderCategories' },
        SELECT_CATEGORY: { actions: 'selectCategory' },
        ADD_QUESTION: { actions: 'addQuestion' },
        UPDATE_QUESTION: { actions: 'updateQuestion' },
        DELETE_QUESTION: { actions: 'deleteQuestion' },
        REORDER_QUESTIONS: { actions: 'reorderQuestions' },
        SELECT_QUESTION: { actions: 'selectQuestion' },
        DUPLICATE_QUESTION: { actions: 'duplicateQuestion' },
        ADD_OPTION: { actions: 'addOption' },
        UPDATE_OPTION: { actions: 'updateOption' },
        DELETE_OPTION: { actions: 'deleteOption' },
        REORDER_OPTIONS: { actions: 'reorderOptions' },
        ADD_FOLLOWUP: { actions: 'addFollowup' },
        UPDATE_FOLLOWUP: { actions: 'updateFollowup' },
        DELETE_FOLLOWUP: { actions: 'deleteFollowup' },
        SET_TAB: { actions: 'setTab' },
        VALIDATE: { actions: 'validate' },
        CLEAR_ERROR: { actions: 'clearError' },
      },
    },
  },
})

export type BuilderMachine = typeof builderMachine
