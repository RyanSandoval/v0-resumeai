import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    features: {
      aiOptimization: true,
      keywordAnalysis: true,
      templateSelection: true,
      pdfExport: true,
      docxExport: true,
    },
    limits: {
      freeUsers: {
        resumeCount: 2,
        optimizationsPerMonth: 5,
      },
      premiumUsers: {
        resumeCount: 10,
        optimizationsPerMonth: 50,
      },
    },
  })
}
