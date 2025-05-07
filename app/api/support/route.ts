import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    supportResources: {
      faq: "/faq",
      contactEmail: "support@resumeoptimizer.example",
      phoneNumber: "+1 (555) 123-4567",
      hours: "Monday-Friday, 9am-5pm EST",
      articles: [
        {
          id: 1,
          title: "Getting Started Guide",
          url: "/help/getting-started",
        },
        {
          id: 2,
          title: "How to Optimize Your Resume",
          url: "/help/optimization-guide",
        },
        {
          id: 3,
          title: "Choosing the Right Template",
          url: "/help/template-selection",
        },
      ],
    },
  })
}
