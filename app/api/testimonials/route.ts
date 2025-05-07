import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    testimonials: [
      {
        id: 1,
        name: "Michael R.",
        position: "Software Developer",
        company: "Tech Innovations Inc.",
        quote: "Resume Optimizer helped me land my dream job! The keyword analysis was spot on.",
        rating: 5,
      },
      {
        id: 2,
        name: "Sarah L.",
        position: "Marketing Manager",
        company: "Global Marketing Solutions",
        quote: "I was struggling to get interviews until I used Resume Optimizer. Now I have multiple offers!",
        rating: 5,
      },
      {
        id: 3,
        name: "David K.",
        position: "Data Analyst",
        company: "Data Insights Co.",
        quote: "The template selection and customization options are excellent. Highly recommended!",
        rating: 4,
      },
    ],
  })
}
