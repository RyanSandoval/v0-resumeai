import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    posts: [
      {
        id: 1,
        title: "10 Tips for a Standout Resume",
        excerpt: "Learn how to make your resume stand out from the crowd with these expert tips.",
        date: "2023-04-05",
        author: "Jane Smith",
        slug: "10-tips-standout-resume",
      },
      {
        id: 2,
        title: "The Importance of Keywords in Your Resume",
        excerpt: "Discover why keywords are crucial for getting past ATS systems and into the hands of recruiters.",
        date: "2023-03-20",
        author: "John Doe",
        slug: "importance-keywords-resume",
      },
      {
        id: 3,
        title: "Resume Trends for 2023",
        excerpt: "Stay ahead of the curve with these resume trends that are gaining popularity in 2023.",
        date: "2023-02-15",
        author: "Sarah Johnson",
        slug: "resume-trends-2023",
      },
    ],
  })
}
