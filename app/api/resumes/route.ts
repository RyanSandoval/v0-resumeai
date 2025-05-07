import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    resumes: [
      {
        id: 1,
        title: "Software Engineer Resume",
        lastUpdated: "2023-01-15",
      },
      {
        id: 2,
        title: "Product Manager Resume",
        lastUpdated: "2023-02-20",
      },
      {
        id: 3,
        title: "Data Scientist Resume",
        lastUpdated: "2023-03-10",
      },
    ],
  })
}
