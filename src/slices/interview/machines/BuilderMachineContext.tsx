import { createContext, useContext, useSyncExternalStore } from 'react'
import { createActor } from 'xstate'
import {
  builderMachine,
  draftToExportConfig,
  validateConfig,
} from './builder-machine'
import type {
  DraftInterviewConfig,
  DraftKategorie,
  DraftFrage,
  InterviewConfig,
  ValidationResult,
  BuilderTab,
} from '../types'

// =============================================================================
// Types
// =============================================================================

interface BuilderMachineContextValue {
  // Selectors
  config: DraftInterviewConfig
  selectedCategory: DraftKategorie | null
  selectedQuestion: DraftFrage | null
  selectedCategoryId: string | null
  selectedQuestionId: string | null
  hasUnsavedChanges: boolean
  validationResult: ValidationResult | null
  activeTab: BuilderTab
  error: string | null

  // Config operations
  newConfig: () => void
  importConfig: (config: InterviewConfig) => void
  exportConfig: () => InterviewConfig
  markSaved: () => void

  // Category operations
  addCategory: () => void
  updateCategory: (categoryId: string, titel: string) => void
  deleteCategory: (categoryId: string) => void
  reorderCategories: (fromIndex: number, toIndex: number) => void
  selectCategory: (categoryId: string | null) => void

  // Question operations
  addQuestion: (categoryId: string) => void
  updateQuestion: (categoryId: string, questionId: string, updates: Partial<DraftFrage>) => void
  deleteQuestion: (categoryId: string, questionId: string) => void
  reorderQuestions: (categoryId: string, fromIndex: number, toIndex: number) => void
  selectQuestion: (questionId: string | null) => void
  duplicateQuestion: (categoryId: string, questionId: string) => void

  // Option operations
  addOption: (categoryId: string, questionId: string) => void
  updateOption: (categoryId: string, questionId: string, optionIndex: number, value: string) => void
  deleteOption: (categoryId: string, questionId: string, optionIndex: number) => void
  reorderOptions: (categoryId: string, questionId: string, fromIndex: number, toIndex: number) => void

  // Follow-up operations
  addFollowup: (categoryId: string, questionId: string, triggerValue: string, text: string) => void
  updateFollowup: (categoryId: string, questionId: string, triggerValue: string, text: string) => void
  deleteFollowup: (categoryId: string, questionId: string, triggerValue: string) => void

  // Navigation
  setTab: (tab: BuilderTab) => void

  // Validation
  validate: () => ValidationResult
}

const BuilderMachineContext = createContext<BuilderMachineContextValue | null>(null)

// =============================================================================
// Actor Singleton
// =============================================================================

const actor = createActor(builderMachine)
actor.start()

// =============================================================================
// Provider Component
// =============================================================================

export function BuilderMachineProvider({
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

  // Get selected category
  const getSelectedCategory = (): DraftKategorie | null => {
    const { config, selectedCategoryId } = state.context
    if (!selectedCategoryId) return null
    return config.kategorien.find((k) => k.id === selectedCategoryId) || null
  }

  // Get selected question
  const getSelectedQuestion = (): DraftFrage | null => {
    const { config, selectedCategoryId, selectedQuestionId } = state.context
    if (!selectedCategoryId || !selectedQuestionId) return null
    const category = config.kategorien.find((k) => k.id === selectedCategoryId)
    if (!category) return null
    return category.fragen.find((f) => f.id === selectedQuestionId) || null
  }

  const value: BuilderMachineContextValue = {
    // Selectors
    config: state.context.config,
    selectedCategory: getSelectedCategory(),
    selectedQuestion: getSelectedQuestion(),
    selectedCategoryId: state.context.selectedCategoryId,
    selectedQuestionId: state.context.selectedQuestionId,
    hasUnsavedChanges: state.context.hasUnsavedChanges,
    validationResult: state.context.validationResult,
    activeTab: state.context.activeTab,
    error: state.context.error,

    // Config operations
    newConfig: () => actor.send({ type: 'NEW_CONFIG' }),
    importConfig: (config) => actor.send({ type: 'IMPORT_CONFIG', config }),
    exportConfig: () => draftToExportConfig(state.context.config),
    markSaved: () => actor.send({ type: 'MARK_SAVED' }),

    // Category operations
    addCategory: () => actor.send({ type: 'ADD_CATEGORY' }),
    updateCategory: (categoryId, titel) =>
      actor.send({ type: 'UPDATE_CATEGORY', categoryId, titel }),
    deleteCategory: (categoryId) =>
      actor.send({ type: 'DELETE_CATEGORY', categoryId }),
    reorderCategories: (fromIndex, toIndex) =>
      actor.send({ type: 'REORDER_CATEGORIES', fromIndex, toIndex }),
    selectCategory: (categoryId) =>
      actor.send({ type: 'SELECT_CATEGORY', categoryId }),

    // Question operations
    addQuestion: (categoryId) =>
      actor.send({ type: 'ADD_QUESTION', categoryId }),
    updateQuestion: (categoryId, questionId, updates) =>
      actor.send({ type: 'UPDATE_QUESTION', categoryId, questionId, updates }),
    deleteQuestion: (categoryId, questionId) =>
      actor.send({ type: 'DELETE_QUESTION', categoryId, questionId }),
    reorderQuestions: (categoryId, fromIndex, toIndex) =>
      actor.send({ type: 'REORDER_QUESTIONS', categoryId, fromIndex, toIndex }),
    selectQuestion: (questionId) =>
      actor.send({ type: 'SELECT_QUESTION', questionId }),
    duplicateQuestion: (categoryId, questionId) =>
      actor.send({ type: 'DUPLICATE_QUESTION', categoryId, questionId }),

    // Option operations
    addOption: (categoryId, questionId) =>
      actor.send({ type: 'ADD_OPTION', categoryId, questionId }),
    updateOption: (categoryId, questionId, optionIndex, value) =>
      actor.send({ type: 'UPDATE_OPTION', categoryId, questionId, optionIndex, value }),
    deleteOption: (categoryId, questionId, optionIndex) =>
      actor.send({ type: 'DELETE_OPTION', categoryId, questionId, optionIndex }),
    reorderOptions: (categoryId, questionId, fromIndex, toIndex) =>
      actor.send({ type: 'REORDER_OPTIONS', categoryId, questionId, fromIndex, toIndex }),

    // Follow-up operations
    addFollowup: (categoryId, questionId, triggerValue, text) =>
      actor.send({ type: 'ADD_FOLLOWUP', categoryId, questionId, triggerValue, text }),
    updateFollowup: (categoryId, questionId, triggerValue, text) =>
      actor.send({ type: 'UPDATE_FOLLOWUP', categoryId, questionId, triggerValue, text }),
    deleteFollowup: (categoryId, questionId, triggerValue) =>
      actor.send({ type: 'DELETE_FOLLOWUP', categoryId, questionId, triggerValue }),

    // Navigation
    setTab: (tab) => actor.send({ type: 'SET_TAB', tab }),

    // Validation
    validate: () => {
      actor.send({ type: 'VALIDATE' })
      return validateConfig(state.context.config)
    },
  }

  return (
    <BuilderMachineContext.Provider value={value}>
      {children}
    </BuilderMachineContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useBuilderMachine() {
  const context = useContext(BuilderMachineContext)
  if (!context) {
    throw new Error(
      'useBuilderMachine must be used within BuilderMachineProvider'
    )
  }
  return context
}
