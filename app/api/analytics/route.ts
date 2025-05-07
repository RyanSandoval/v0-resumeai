import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    analytics: {
      resumeViews: 245,
      downloadCount: 78,
      optimizationCount: 32,
      averageScore: 85,
      topKeywords: ["JavaScript", "React", "Node.js", "TypeScript", "AWS"],
    },
  })
}
