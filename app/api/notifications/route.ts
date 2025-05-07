import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    notifications: [
      {
        id: 1,
        type: "optimization",
        message: "Your resume optimization is complete!",
        date: "2023-04-12T10:30:00Z",
        read: false,
      },
      {
        id: 2,
        type: "system",
        message: "New templates are now available.",
        date: "2023-04-10T14:15:00Z",
        read: true,
      },
      {
        id: 3,
        type: "billing",
        message: "Your subscription has been renewed.",
        date: "2023-04-01T00:00:00Z",
        read: true,
      },
    ],
  })
}
