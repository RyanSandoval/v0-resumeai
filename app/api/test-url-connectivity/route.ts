import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 })
    }

    try {
      // Test URL connectivity with a HEAD request first to avoid downloading large content
      const headResponse = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JobURLTester/1.0)",
        },
        cache: "no-store",
      })

      const contentType = headResponse.headers.get("content-type") || "Unknown"
      const contentLength = headResponse.headers.get("content-length") || "Unknown"

      return NextResponse.json({
        success: headResponse.ok,
        status: headResponse.status,
        statusText: headResponse.statusText,
        contentType,
        contentLength,
      })
    } catch (error) {
      console.error("Error testing URL connectivity:", error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect to URL",
      })
    }
  } catch (error) {
    console.error("Error in test-url-connectivity route:", error)
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })
  }
}
