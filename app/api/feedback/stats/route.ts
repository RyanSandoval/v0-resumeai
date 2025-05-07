import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    feedbackStats: {
      averageRating: 4.7,
      totalReviews: 128,
      categories: {
        usability: 4.8,
        features: 4.6,
        results: 4.5,
        support: 4.9,
      },
    },
  })
}
