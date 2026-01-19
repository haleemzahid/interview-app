import { appDataDir, join } from '@tauri-apps/api/path'
import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  writeTextFile,
  remove,
} from '@tauri-apps/plugin-fs'
import type {
  ArchivedInterview,
  ArchivedInterviewMeta,
  InterviewSession,
  InterviewConfig,
} from '../types'

// =============================================================================
// Constants
// =============================================================================

const ARCHIVE_FOLDER = 'interviews'

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the archive directory path, creating it if it doesn't exist
 */
async function getArchiveDirectory(): Promise<string> {
  const appData = await appDataDir()
  const archivePath = await join(appData, ARCHIVE_FOLDER)

  const dirExists = await exists(archivePath)
  if (!dirExists) {
    await mkdir(archivePath, { recursive: true })
  }

  return archivePath
}

/**
 * Generate filename for an archived interview
 */
function generateFilename(session: InterviewSession): string {
  const patientName = `${session.patientInfo.lastName}_${session.patientInfo.firstName}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase()
  const date = session.startedAt.split('T')[0]
  return `${patientName}_${date}_${session.id}.json`
}

/**
 * Extract metadata from a full archived interview
 */
function extractMeta(
  session: InterviewSession,
  config: InterviewConfig
): ArchivedInterviewMeta {
  const totalQuestions = config.kategorien.reduce(
    (sum, k) => sum + k.fragen.length,
    0
  )
  const answeredCount = Object.keys(session.answers).length

  return {
    id: session.id,
    patientName: `${session.patientInfo.firstName} ${session.patientInfo.lastName}`,
    patientDateOfBirth: session.patientInfo.dateOfBirth,
    status: session.status,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    completedAt: session.completedAt,
    questionCount: totalQuestions,
    answeredCount,
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * List all archived interviews
 */
export async function listArchivedInterviews(): Promise<ArchivedInterviewMeta[]> {
  try {
    const archivePath = await getArchiveDirectory()
    const entries = await readDir(archivePath)

    const archives: ArchivedInterviewMeta[] = []

    for (const entry of entries) {
      if (entry.name?.endsWith('.json')) {
        try {
          const filePath = await join(archivePath, entry.name)
          const content = await readTextFile(filePath)
          const data = JSON.parse(content) as ArchivedInterview
          archives.push(data.meta)
        } catch (e) {
          console.error(`Failed to read archive ${entry.name}:`, e)
        }
      }
    }

    // Sort by updatedAt descending (most recent first)
    archives.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    return archives
  } catch (e) {
    console.error('Failed to list archives:', e)
    return []
  }
}

/**
 * Save an interview to the archive
 */
export async function saveInterviewToArchive(
  session: InterviewSession,
  config: InterviewConfig
): Promise<void> {
  const archivePath = await getArchiveDirectory()
  const filename = generateFilename(session)
  const filePath = await join(archivePath, filename)

  // Check if there's an existing file for this session (different filename due to status change)
  const entries = await readDir(archivePath)
  for (const entry of entries) {
    if (entry.name?.includes(session.id) && entry.name !== filename) {
      // Remove old file
      const oldPath = await join(archivePath, entry.name)
      await remove(oldPath)
    }
  }

  const archive: ArchivedInterview = {
    meta: extractMeta(session, config),
    session,
    config,
  }

  await writeTextFile(filePath, JSON.stringify(archive, null, 2))
}

/**
 * Load an archived interview by ID
 */
export async function loadArchivedInterview(
  id: string
): Promise<ArchivedInterview | null> {
  try {
    const archivePath = await getArchiveDirectory()
    const entries = await readDir(archivePath)

    for (const entry of entries) {
      if (entry.name?.includes(id) && entry.name.endsWith('.json')) {
        const filePath = await join(archivePath, entry.name)
        const content = await readTextFile(filePath)
        return JSON.parse(content) as ArchivedInterview
      }
    }

    return null
  } catch (e) {
    console.error(`Failed to load archive ${id}:`, e)
    return null
  }
}

/**
 * Delete an archived interview by ID
 */
export async function deleteArchivedInterview(id: string): Promise<boolean> {
  try {
    const archivePath = await getArchiveDirectory()
    const entries = await readDir(archivePath)

    for (const entry of entries) {
      if (entry.name?.includes(id) && entry.name.endsWith('.json')) {
        const filePath = await join(archivePath, entry.name)
        await remove(filePath)
        return true
      }
    }

    return false
  } catch (e) {
    console.error(`Failed to delete archive ${id}:`, e)
    return false
  }
}

/**
 * Check if an interview exists in the archive
 */
export async function archiveExists(id: string): Promise<boolean> {
  try {
    const archivePath = await getArchiveDirectory()
    const entries = await readDir(archivePath)

    return entries.some(
      (entry) => entry.name?.includes(id) && entry.name.endsWith('.json')
    )
  } catch {
    return false
  }
}
