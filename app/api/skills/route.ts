import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    skills: [
      {
        category: "Technical",
        items: ["JavaScript", "Python", "React", "Node.js", "SQL", "AWS", "Docker"],
      },
      {
        category: "Soft Skills",
        items: ["Communication", "Leadership", "Teamwork", "Problem Solving", "Time Management"],
      },
      {
        category: "Design",
        items: ["UI/UX", "Figma", "Adobe Creative Suite", "Sketch", "Wireframing"],
      },
      {
        category: "Data",
        items: ["Data Analysis", "Machine Learning", "Statistics", "Excel", "Tableau", "Power BI"],
      },
      {
        category: "Marketing",
        items: ["SEO", "Content Marketing", "Social Media", "Email Marketing", "Google Analytics"],
      },
    ],
  })
}
