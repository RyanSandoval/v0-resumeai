import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    industries: [
      {
        id: 1,
        name: "Technology",
        keywords: ["software", "development", "programming", "agile", "scrum"],
      },
      {
        id: 2,
        name: "Finance",
        keywords: ["analysis", "investment", "banking", "accounting", "financial"],
      },
      {
        id: 3,
        name: "Healthcare",
        keywords: ["patient", "care", "medical", "clinical", "health"],
      },
      {
        id: 4,
        name: "Marketing",
        keywords: ["campaign", "social media", "content", "strategy", "brand"],
      },
      {
        id: 5,
        name: "Education",
        keywords: ["teaching", "curriculum", "instruction", "learning", "assessment"],
      },
    ],
  })
}
