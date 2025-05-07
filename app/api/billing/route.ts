import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    billing: {
      plan: "Premium",
      nextBillingDate: "2023-05-15",
      amount: 19.99,
      paymentMethod: "Visa ending in 4242",
      invoices: [
        {
          id: "INV-001",
          date: "2023-04-15",
          amount: 19.99,
          status: "Paid",
        },
        {
          id: "INV-002",
          date: "2023-03-15",
          amount: 19.99,
          status: "Paid",
        },
      ],
    },
  })
}
