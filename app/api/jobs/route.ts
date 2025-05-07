import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    jobs: [
      {
        id: 1,
        title: "Software Engineer",
        company: "Tech Solutions Inc.",
        location: "San Francisco, CA",
        description: "We are looking for a skilled Software Engineer to join our team...",
        requirements: ["5+ years of experience", "JavaScript", "React", "Node.js"],
      },
      {
        id: 2,
        title: "Product Manager",
        company: "Innovative Products Co.",
        location: "New York, NY",
        description: "Seeking an experienced Product Manager to lead our product development...",
        requirements: ["3+ years of experience", "Agile methodologies", "User research"],
      },
      {
        id: 3,
        title: "Data Scientist",
        company: "Data Insights LLC",
        location: "Remote",
        description: "Join our data science team to analyze complex datasets and provide insights...",
        requirements: ["Python", "Machine Learning", "Statistics", "Data visualization"],
      },
    ],
  })
}
