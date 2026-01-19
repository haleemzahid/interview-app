/**
 * Interview Application Type Definitions
 *
 * This file defines the core data structures for the clinical interview application.
 * All interview content is loaded from external JSON files to allow customization
 * without code changes.
 *
 * JSON format uses German field names as per client specification.
 */

// =============================================================================
// Question Types (Client's JSON Format - German)
// =============================================================================

/**
 * Question types in client's format:
 * - ja_nein: Yes/No question
 * - checkboxen: Multiple choice (checkboxes)
 * - dropdown: Single choice dropdown
 * - textarea: Free text input
 */
export type FrageTyp = 'ja_nein' | 'checkboxen' | 'dropdown' | 'textarea'

/**
 * Follow-up mapping: answer value -> follow-up question text
 * e.g., { "Ja": "Welche Auslöser waren das?" }
 */
export type FollowUpMap = Record<string, string>

/**
 * Question structure in client's JSON format
 */
export interface Frage {
  id: string
  text: string
  typ: FrageTyp
  /** Options for checkboxen and dropdown types */
  optionen?: string[]
  /** Follow-up questions triggered by specific answers */
  followup?: FollowUpMap
  /** Condition for showing this question (e.g., "{sym_konzentration} = 'Ja'") */
  bedingung?: string
}

/**
 * Category structure in client's JSON format
 */
export interface Kategorie {
  titel: string
  fragen: Frage[]
}

/**
 * Root questionnaire structure in client's JSON format
 */
export interface InterviewConfig {
  kategorien: Kategorie[]
}

// =============================================================================
// Internal Types (for state management)
// =============================================================================

/**
 * Flattened question for internal processing
 */
export interface FlattenedQuestion {
  id: string
  text: string
  typ: FrageTyp
  optionen?: string[]
  followup?: FollowUpMap
  bedingung?: string
  /** Category title this question belongs to */
  kategorie: string
  /** Category index for ordering */
  kategorieIndex: number
  /** Whether this is a dynamically created follow-up */
  isFollowUp?: boolean
  /** Parent question ID if this is a follow-up */
  parentQuestionId?: string
  /** The answer that triggered this follow-up */
  triggerValue?: string
}

/**
 * Active follow-up state
 */
export interface ActiveFollowUp {
  parentQuestionId: string
  triggerValue: string
  followUpText: string
  followUpId: string
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
  value: string | boolean | string[]
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
  patientInfo: PatientInfo
  answers: Record<string, Answer>
  manualFollowUps: ManualFollowUp[]
  notes: string
  /** Current position in the question flow */
  currentQuestionIndex: number
  /** Active follow-up being answered */
  activeFollowUp: ActiveFollowUp | null
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

export type NavigationTab = 'interview' | 'tests' | 'notes' | 'export'

// =============================================================================
// Builder Types (for Interview Config Editor)
// =============================================================================

/**
 * Draft question used in the builder (may have incomplete data)
 */
export interface DraftFrage {
  id: string
  text: string
  typ: FrageTyp
  optionen?: string[]
  followup?: FollowUpMap
  bedingung?: string
}

/**
 * Draft category used in the builder
 */
export interface DraftKategorie {
  id: string // Internal ID for drag/drop and React keys
  titel: string
  fragen: DraftFrage[]
}

/**
 * Draft interview config used in the builder
 */
export interface DraftInterviewConfig {
  kategorien: DraftKategorie[]
}

/**
 * Validation error for a specific field
 */
export interface ValidationError {
  path: string // e.g., "kategorien[0].fragen[1].text"
  message: string
}

/**
 * Result of validating a draft config
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Builder navigation tab
 */
export type BuilderTab = 'editor' | 'preview' | 'json'

// =============================================================================
// Archive Types
// =============================================================================

/**
 * Metadata for an archived interview (lightweight for listing)
 */
export interface ArchivedInterviewMeta {
  id: string
  patientName: string
  patientDateOfBirth?: string
  status: 'in_progress' | 'completed' | 'paused'
  startedAt: string
  updatedAt: string
  completedAt?: string
  questionCount: number
  answeredCount: number
  configName?: string
}

/**
 * Full archived interview data (for loading/resuming)
 */
export interface ArchivedInterview {
  meta: ArchivedInterviewMeta
  session: InterviewSession
  config: InterviewConfig
}

// =============================================================================
// Category Navigation Types
// =============================================================================

/**
 * Category progress information for sidebar display
 */
export interface CategoryProgress {
  title: string
  index: number
  totalQuestions: number
  answeredQuestions: number
  visibleQuestions: FlattenedQuestion[]
  isCurrentCategory: boolean
}
