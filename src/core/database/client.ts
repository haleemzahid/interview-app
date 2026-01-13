import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

// Path to existing PennPOS database
const PENNPOS_DB_PATH =
  'sqlite:C:\\Users\\Haleem Khan\\AppData\\Local\\Packages\\com.companynameV2.PennPOS.App_dp9yhbjdv06c8\\LocalState\\efcoredbv3.db3'

/**
 * Initialize the SQLite database
 * Connects to the existing PennPOS database
 */
export async function initDatabase() {
  if (!db) {
    // Connect to existing PennPOS database
    db = await Database.load(PENNPOS_DB_PATH)

    // Create todos table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create users table for future use
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
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
