import { Pool } from "@neondatabase/serverless"

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Helper function to execute SQL queries
export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now()
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: result.rowCount })
    return result
  } catch (error) {
    console.error("Error executing query", error)
    throw error
  }
}

// Initialize the database
export async function initDatabase() {
  try {
    // Create users table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create resumes table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT DEFAULT 'Untitled Resume',
        original_text TEXT,
        optimized_text TEXT,
        job_description TEXT,
        job_url TEXT,
        keywords TEXT[],
        score INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log("Database initialized")
    return { success: true }
  } catch (error) {
    console.error("Error initializing database", error)
    return { success: false, error }
  }
}

// User functions
export async function createUser(user: { id: string; name?: string; email?: string; image?: string }) {
  try {
    const result = await query(
      `
      INSERT INTO users (id, name, email, image)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE
      SET name = $2, email = $3, image = $4
      RETURNING *
      `,
      [user.id, user.name, user.email, user.image],
    )
    return result.rows[0]
  } catch (error) {
    console.error("Error creating user", error)
    throw error
  }
}

export async function getUserById(id: string) {
  try {
    const result = await query("SELECT * FROM users WHERE id = $1", [id])
    return result.rows[0]
  } catch (error) {
    console.error("Error getting user", error)
    throw error
  }
}

// Resume functions
export async function createResume(resume: {
  id: string
  userId: string
  title: string
  originalText: string
  optimizedText: string
  jobDescription?: string
  jobUrl?: string
  keywords: string[]
  score: number
}) {
  try {
    const result = await query(
      `
      INSERT INTO resumes (id, user_id, title, original_text, optimized_text, job_description, job_url, keywords, score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        resume.id,
        resume.userId,
        resume.title,
        resume.originalText,
        resume.optimizedText,
        resume.jobDescription || "",
        resume.jobUrl || "",
        resume.keywords,
        resume.score,
      ],
    )
    return result.rows[0]
  } catch (error) {
    console.error("Error creating resume", error)
    throw error
  }
}

export async function getResumesByUserId(userId: string) {
  try {
    const result = await query("SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC", [userId])
    return result.rows
  } catch (error) {
    console.error("Error getting resumes", error)
    throw error
  }
}

export async function getResumeById(id: string, userId: string) {
  try {
    const result = await query("SELECT * FROM resumes WHERE id = $1 AND user_id = $2", [id, userId])
    return result.rows[0]
  } catch (error) {
    console.error("Error getting resume", error)
    throw error
  }
}

export async function updateResumeTitle(id: string, userId: string, title: string) {
  try {
    const result = await query(
      `
      UPDATE resumes
      SET title = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING *
      `,
      [title, id, userId],
    )
    return result.rows[0]
  } catch (error) {
    console.error("Error updating resume title", error)
    throw error
  }
}

export async function deleteResume(id: string, userId: string) {
  try {
    await query("DELETE FROM resumes WHERE id = $1 AND user_id = $2", [id, userId])
    return { success: true }
  } catch (error) {
    console.error("Error deleting resume", error)
    throw error
  }
}
