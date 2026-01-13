import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

// Path to interview app database
const INTERVIEW_DB_PATH = 'sqlite:interview_data.db'

/**
 * Initialize the SQLite database
 * Creates a local database for interview sessions
 */
export async function initDatabase() {
  if (!db) {
    // Create/connect to interview database
    db = await Database.load(INTERVIEW_DB_PATH)

    // Create questionnaires table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS questionnaires (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        author TEXT,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create interview sessions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS interview_sessions (
        id TEXT PRIMARY KEY,
        questionnaire_id TEXT NOT NULL,
        questionnaire_name TEXT NOT NULL,
        patient_first_name TEXT NOT NULL,
        patient_last_name TEXT NOT NULL,
        patient_dob TEXT,
        patient_gender TEXT,
        patient_notes TEXT,
        answers TEXT NOT NULL DEFAULT '{}',
        manual_followups TEXT NOT NULL DEFAULT '[]',
        notes TEXT DEFAULT '',
        current_question_index INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'in_progress',
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id)
      )
    `)

    // Create autosave table for crash recovery
    await db.execute(`
      CREATE TABLE IF NOT EXISTS autosave (
        session_id TEXT PRIMARY KEY,
        session_data TEXT NOT NULL,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('Interview database initialized successfully')
  }
  return db
}

/**
 * Get the database instance
 */
export async function getDatabase() {
  if (!db) {
    return await initDatabase()
  }
  return db
}

/**
 * Save interview session to database
 */
export async function saveSession(sessionData: string, sessionId: string) {
  const database = await getDatabase()
  await database.execute(
    `INSERT OR REPLACE INTO autosave (session_id, session_data, saved_at) VALUES (?, ?, datetime('now'))`,
    [sessionId, sessionData]
  )
}

/**
 * Load interview session from database
 */
export async function loadSession(sessionId: string): Promise<string | null> {
  const database = await getDatabase()
  const result = await database.select<{ session_data: string }[]>(
    `SELECT session_data FROM autosave WHERE session_id = ?`,
    [sessionId]
  )
  return result.length > 0 ? result[0].session_data : null
}
