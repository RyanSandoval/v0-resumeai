import { NextResponse } from "next/server"
import * as db from "@/lib/db"

export async function GET() {
  try {
    const result = await db.initDatabase()

    if (result.success) {
      return NextResponse.json({ message: "Database initialized successfully" })
    } else {
      return NextResponse.json({ error: "Failed to initialize database" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
