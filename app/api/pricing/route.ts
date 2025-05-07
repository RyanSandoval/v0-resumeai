import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    plans: [
      {
        id: "free",
        name: "Free",
        price: 0,
        features: ["2 Resume Slots", "5 Optimizations per Month", "Basic Templates", "PDF Export"],
        recommended: false,
      },
      {
        id: "premium",
        name: "Premium",
        price: 19.99,
        interval: "month",
        features: [
          "10 Resume Slots",
          "Unlimited Optimizations",
          "All Templates",
          "All Export Formats",
          "Priority Support",
          "Advanced Analytics",
        ],
        recommended: true,
      },
      {
        id: "annual",
        name: "Annual",
        price: 199.99,
        interval: "year",
        features: [
          "10 Resume Slots",
          "Unlimited Optimizations",
          "All Templates",
          "All Export Formats",
          "Priority Support",
          "Advanced Analytics",
          "2 Months Free",
        ],
        recommended: false,
      },
    ],
  })
}
