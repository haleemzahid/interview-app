/**
 * Interview Application Type Definitions
 *
 * This file defines the core data structures for the clinical interview application.
 * All interview content is loaded from external JSON files to allow customization
 * without code changes.
 */

// =============================================================================
// Question Types
// =============================================================================

export type AnswerType =
  | 'yes_no'
  | 'scale'
  | 'text'
  | 'multi_choice'
  | 'single_choice'
  | 'date'
  | 'number'

export interface ScaleConfig {
  min: number
  max: number
  minLabel?: string
  maxLabel?: string
  step?: number
}

export interface ChoiceOption {
  id: string
  label: string
  value: string
}

export interface FollowUpRule {
  /** Condition to trigger follow-up (e.g., "yes", ">5", "contains:severe") */
  condition: string
  /** IDs of follow-up questions to show */
  followUpIds: string[]
}

export interface Question {
  id: string
  text: string
  answerType: AnswerType
  /** Category/section this question belongs to */
  category?: string
  /** Whether this question is required */
  required?: boolean
  /** Placeholder text for text inputs */
  placeholder?: string
  /** Help text shown below the question */
  helpText?: string
  /** Options for choice-based questions */
  options?: ChoiceOption[]
  /** Configuration for scale questions */
  scaleConfig?: ScaleConfig
  /** Rules for conditional follow-ups */
  followUpRules?: FollowUpRule[]
  /** Whether this is a follow-up question (not shown in main flow) */
  isFollowUp?: boolean
  /** Parent question ID if this is a follow-up */
  parentQuestionId?: string
}

// =============================================================================
// Interview/Questionnaire Types
// =============================================================================

export interface QuestionnaireCategory {
  id: string
  name: string
  description?: string
  order: number
}

export interface Questionnaire {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  categories: QuestionnaireCategory[]
  questions: Question[]
  createdAt?: string
  updatedAt?: string
}

// =============================================================================
// Session & Answer Types
// =============================================================================

export interface PatientInfo {
  id?: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  notes?: string
}

export interface Answer {
  questionId: string
  value: string | number | boolean | string[]
  timestamp: string
  /** Manual notes added by clinician */
  clinicianNotes?: string
}

export interface ManualFollowUp {
  id: string
  questionId: string
  text: string
  timestamp: string
}

export interface InterviewSession {
  id: string
  questionnaireId: string
  questionnaireName: string
  patientInfo: PatientInfo
  answers: Record<string, Answer>
  manualFollowUps: ManualFollowUp[]
  notes: string
  currentQuestionIndex: number
  status: 'in_progress' | 'completed' | 'paused'
  startedAt: string
  updatedAt: string
  completedAt?: string
}

// =============================================================================
// UI State Types
// =============================================================================

export interface InterviewProgress {
  current: number
  total: number
  percentage: number
  answeredCount: number
}

export interface ActiveFollowUp {
  questionId: string
  followUpIds: string[]
  currentIndex: number
}

export type NavigationTab = 'interview' | 'tests' | 'notes' | 'export'
