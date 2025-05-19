import { XAI } from "xai"

let xaiClient: XAI | null = null

export function getXaiClient(): XAI | null {
  if (xaiClient) {
    return xaiClient
  }

  const apiKey = process.env.XAI_API_KEY

  if (!apiKey) {
    console.error("XAI_API_KEY environment variable is not set")
    return null
  }

  try {
    xaiClient = new XAI({
      apiKey,
    })

    return xaiClient
  } catch (error) {
    console.error("Failed to initialize XAI client:", error)
    return null
  }
}
