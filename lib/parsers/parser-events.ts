/**
 * Parser event logging system
 * Tracks parsing events for debugging and analytics
 */

type ParserEventType = "start" | "success" | "error" | "fallback" | "warning"

type FileFormat =
  | "pdf"
  | "docx"
  | "txt"
  | "file"
  | "docx-fallback"
  | "docx-fallback-jszip"
  | "docx-fallback-text"
  | "docx-sample"
  | "pdf-sample"
  | "txt-sample"
  | "pdf-fallback"
  | "unsupported-format"
  | "extraction"
  | "file-size"

interface ParserEvent {
  type: ParserEventType
  format: FileFormat
  fileName: string
  fileSize: number
  timestamp: string
  textLength?: number
  error?: Error | string
  duration?: number
}

// Store recent events in memory for debugging
const recentEvents: ParserEvent[] = []
const MAX_EVENTS = 50

/**
 * Log a parsing event
 */
export function logParsingEvent(
  type: ParserEventType,
  format: FileFormat,
  fileName: string,
  fileSize: number,
  textLength?: number,
  error?: Error | unknown,
): void {
  const event: ParserEvent = {
    type,
    format,
    fileName,
    fileSize,
    timestamp: new Date().toISOString(),
    textLength,
    error: error instanceof Error ? error.message : (error as string),
  }

  // Add to recent events
  recentEvents.unshift(event)

  // Trim to max length
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.pop()
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Parser Event] ${type} - ${format} - ${fileName} - ${fileSize} bytes`)
    if (textLength) console.log(`  Text length: ${textLength} characters`)
    if (error) console.error(`  Error:`, error)
  }

  // In a real app, you might send this to an analytics service
}

/**
 * Get recent parsing events
 */
export function getRecentParsingEvents(): ParserEvent[] {
  return [...recentEvents]
}

/**
 * Clear recent parsing events
 */
export function clearParsingEvents(): void {
  recentEvents.length = 0
}

/**
 * Get parsing success rate
 */
export function getParsingSuccessRate(): { total: number; success: number; rate: number } {
  const total = recentEvents.filter((e) => e.type === "start").length
  const success = recentEvents.filter((e) => e.type === "success").length
  const rate = total > 0 ? (success / total) * 100 : 0

  return {
    total,
    success,
    rate: Math.round(rate * 10) / 10,
  }
}

export function dispatchParsingMethod(method: string) {
  console.log(`Parsing method used: ${method}`)
}
