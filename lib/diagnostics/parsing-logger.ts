/**
 * Parsing Logger
 * Comprehensive logging system for tracking PDF parsing attempts, steps, and errors
 */

// Store logs for the current session
const parsingLogs: Array<{
  timestamp: Date
  parser: string
  type: "step" | "error" | "success"
  message: string
  details?: any
}> = []

// Maximum number of logs to keep
const MAX_LOGS = 100

/**
 * Log a parsing step
 */
export function logParsingStep(parser: string, message: string): void {
  const log = {
    timestamp: new Date(),
    parser,
    type: "step" as const,
    message,
  }

  console.log(`[${parser}] ${message}`)
  addLog(log)
}

/**
 * Log a parsing error
 */
export function logParsingError(parser: string, message: string, error: any): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  const log = {
    timestamp: new Date(),
    parser,
    type: "error" as const,
    message,
    details: {
      errorMessage,
      stack,
    },
  }

  console.error(`[${parser}] ${message}: ${errorMessage}`)
  addLog(log)
}

/**
 * Log a parsing success
 */
export function logParsingSuccess(parser: string, message: string, contentLength?: number): void {
  const log = {
    timestamp: new Date(),
    parser,
    type: "success" as const,
    message: contentLength ? `${message} (${contentLength} characters extracted)` : message,
  }

  console.log(`[${parser}] ${log.message}`)
  addLog(log)
}

/**
 * Add a log to the log store
 */
function addLog(log: any): void {
  parsingLogs.push(log)

  // Keep logs under the maximum size
  if (parsingLogs.length > MAX_LOGS) {
    parsingLogs.shift()
  }
}

/**
 * Get all parsing logs
 */
export function getParsingLogs(): Array<any> {
  return [...parsingLogs]
}

/**
 * Get logs for a specific parser
 */
export function getParserLogs(parser: string): Array<any> {
  return parsingLogs.filter((log) => log.parser === parser)
}

/**
 * Generate a detailed parsing report
 */
export function generateParsingReport(): string {
  let report = "=== PDF PARSING REPORT ===\n\n"

  // Group logs by parser
  const parserGroups = new Map<string, Array<any>>()

  for (const log of parsingLogs) {
    if (!parserGroups.has(log.parser)) {
      parserGroups.set(log.parser, [])
    }
    parserGroups.get(log.parser)!.push(log)
  }

  // Generate report for each parser
  for (const [parser, logs] of parserGroups.entries()) {
    report += `== ${parser} ==\n`

    for (const log of logs) {
      const time = log.timestamp.toISOString().split("T")[1].split(".")[0]

      if (log.type === "step") {
        report += `${time} - ${log.message}\n`
      } else if (log.type === "error") {
        report += `${time} - ERROR: ${log.message} - ${log.details?.errorMessage || "Unknown error"}\n`
      } else if (log.type === "success") {
        report += `${time} - SUCCESS: ${log.message}\n`
      }
    }

    report += "\n"
  }

  // Add summary
  const errorCount = parsingLogs.filter((log) => log.type === "error").length
  const successCount = parsingLogs.filter((log) => log.type === "success").length

  report += "=== SUMMARY ===\n"
  report += `Total Steps: ${parsingLogs.length}\n`
  report += `Errors: ${errorCount}\n`
  report += `Successes: ${successCount}\n`

  return report
}

/**
 * Clear all logs
 */
export function clearParsingLogs(): void {
  parsingLogs.length = 0
}
