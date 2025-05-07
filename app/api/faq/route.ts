import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    faqs: [
      {
        question: "How does the resume optimization work?",
        answer:
          "Our AI-powered system analyzes your resume against job descriptions to identify key improvements and keyword opportunities.",
      },
      {
        question: "Can I export my resume to PDF?",
        answer: "Yes, you can export your optimized resume to PDF, DOCX, and other formats.",
      },
      {
        question: "How many resumes can I create?",
        answer: "Free users can create up to 2 resumes, while Premium users can create up to 10 resumes.",
      },
      {
        question: "Is my data secure?",
        answer: "Yes, we use industry-standard encryption and security practices to protect your data.",
      },
      {
        question: "Can I cancel my subscription?",
        answer: "Yes, you can cancel your subscription at any time from your account settings.",
      },
    ],
  })
}
