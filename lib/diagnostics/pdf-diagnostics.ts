/**
 * PDF Diagnostics
 * Tools for diagnosing issues with PDF files and the PDF.js library
 */

import { logParsingStep, logParsingError } from "./parsing-logger"

/**
 * Check if PDF.js is available and working
 */
export async function checkPDFJSAvailability(): Promise<{
  available: boolean
  version?: string
  error?: string
}> {
  if (typeof window === "undefined") {
    return { available: false, error: "Not in browser environment" }
  }

  try {
    const pdfjs = await import("pdfjs-dist")
    return {
      available: true,
      version: pdfjs.version || "unknown",
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : "Unknown error importing PDF.js",
    }
  }
}

/**
 * Check if PDF.js worker is available and working
 */
export async function checkPDFJSWorker(): Promise<{
  available: boolean
  error?: string
}> {
  if (typeof window === "undefined") {
    return { available: false, error: "Not in browser environment" }
  }

  try {
    const pdfjs = await import("pdfjs-dist")

    if (!pdfjs.GlobalWorkerOptions) {
      return { available: false, error: "GlobalWorkerOptions not available" }
    }

    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      return { available: false, error: "Worker source not set" }
    }

    return { available: true }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : "Unknown error checking worker",
    }
  }
}

/**
 * Analyze a PDF file to identify potential issues
 */
export async function analyzePDFFile(file: File): Promise<{
  valid: boolean
  fileInfo: {
    name: string
    size: number
    type: string
  }
  issues: string[]
  recommendations: string[]
}> {
  const issues: string[] = []
  const recommendations: string[] = []

  logParsingStep("PDF Diagnostics", `Analyzing file: ${file.name}`)

  // Basic file checks
  const fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
  }

  // Check file size
  if (file.size === 0) {
    issues.push("File is empty (0 bytes)")
    recommendations.push("Upload a valid PDF file")
  } else if (file.size > 10 * 1024 * 1024) {
    issues.push("File is very large (> 10MB)")
    recommendations.push("Try compressing the PDF or using a smaller file")
  }

  // Check MIME type
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    issues.push(`File may not be a PDF (type: ${file.type || "unknown"})`)
    recommendations.push("Ensure you're uploading a valid PDF file")
  }

  // Check PDF header
  try {
    const headerBytes = await readFileHeader(file, 1024)
    const headerText = new TextDecoder().decode(headerBytes)

    if (!headerText.startsWith("%PDF-")) {
      issues.push("File does not have a valid PDF header")
      recommendations.push("The file may be corrupted or not a valid PDF")
    } else {
      // Extract PDF version
      const versionMatch = headerText.match(/%PDF-(\d+\.\d+)/)
      if (versionMatch) {
        const version = versionMatch[1]
        logParsingStep("PDF Diagnostics", `PDF version: ${version}`)

        if (Number.parseFloat(version) > 1.7) {
          issues.push(`PDF version ${version} may not be fully supported`)
          recommendations.push("Try converting to PDF 1.7 or earlier for better compatibility")
        }
      }
    }

    // Check for encryption
    if (headerText.includes("/Encrypt")) {
      issues.push("PDF appears to be encrypted or password-protected")
      recommendations.push("Use an unencrypted PDF file")
    }
  } catch (error) {
    logParsingError("PDF Diagnostics", "Error reading file header", error)
    issues.push("Could not read file header")
  }

  // Check browser compatibility
  const browserInfo = getBrowserInfo()
  logParsingStep("PDF Diagnostics", `Browser: ${browserInfo.name} ${browserInfo.version}`)

  if (browserInfo.name === "Safari" && Number.parseFloat(browserInfo.version) < 14) {
    issues.push("Older Safari versions have limited PDF.js support")
    recommendations.push("Try using Chrome, Firefox, or a newer Safari version")
  }

  // Check PDF.js availability
  const pdfJSStatus = await checkPDFJSAvailability()
  if (!pdfJSStatus.available) {
    issues.push(`PDF.js not available: ${pdfJSStatus.error}`)
    recommendations.push("Try refreshing the page or using a different browser")
  } else {
    logParsingStep("PDF Diagnostics", `PDF.js version: ${pdfJSStatus.version}`)
  }

  // Check worker availability
  const workerStatus = await checkPDFJSWorker()
  if (!workerStatus.available) {
    issues.push(`PDF.js worker not available: ${workerStatus.error}`)
    recommendations.push("Try refreshing the page or check network connectivity")
  }

  return {
    valid: issues.length === 0,
    fileInfo,
    issues,
    recommendations,
  }
}

/**
 * Read the first N bytes of a file
 */
async function readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
  const slice = file.slice(0, bytes)
  const arrayBuffer = await slice.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

/**
 * Get browser information
 */
function getBrowserInfo(): { name: string; version: string } {
  if (typeof window === "undefined" || !navigator) {
    return { name: "Unknown", version: "0" }
  }

  const userAgent = navigator.userAgent

  if (userAgent.includes("Firefox/")) {
    const version = userAgent.match(/Firefox\/(\d+\.\d+)/)
    return { name: "Firefox", version: version ? version[1] : "Unknown" }
  } else if (userAgent.includes("Chrome/")) {
    const version = userAgent.match(/Chrome\/(\d+\.\d+)/)
    return { name: "Chrome", version: version ? version[1] : "Unknown" }
  } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) {
    const version = userAgent.match(/Version\/(\d+\.\d+)/)
    return { name: "Safari", version: version ? version[1] : "Unknown" }
  } else if (userAgent.includes("Edge/") || userAgent.includes("Edg/")) {
    const version = userAgent.match(/Edge?\/(\d+\.\d+)/)
    return { name: "Edge", version: version ? version[1] : "Unknown" }
  }

  return { name: "Unknown", version: "0" }
}

/**
 * Generate a comprehensive PDF diagnostics report
 */
export async function generatePDFDiagnosticsReport(file: File): Promise<string> {
  const analysis = await analyzePDFFile(file)
  const pdfJSStatus = await checkPDFJSAvailability()
  const workerStatus = await checkPDFJSWorker()
  const browserInfo = getBrowserInfo()

  let report = "=== PDF DIAGNOSTICS REPORT ===\n\n"

  // File information
  report += `File: ${analysis.fileInfo.name}\n`
  report += `Size: ${(analysis.fileInfo.size / 1024).toFixed(2)} KB\n`
  report += `Type: ${analysis.fileInfo.type || "Unknown"}\n\n`

  // PDF.js status
  report += "PDF.js Status:\n"
  report += `- Available: ${pdfJSStatus.available ? "Yes" : "No"}\n`
  if (pdfJSStatus.version) {
    report += `- Version: ${pdfJSStatus.version}\n`
  }
  if (pdfJSStatus.error) {
    report += `- Error: ${pdfJSStatus.error}\n`
  }
  report += `- Worker Available: ${workerStatus.available ? "Yes" : "No"}\n`
  if (workerStatus.error) {
    report += `- Worker Error: ${workerStatus.error}\n`
  }
  report += "\n"

  // Browser information
  report += "Browser Information:\n"
  report += `- Browser: ${browserInfo.name} ${browserInfo.version}\n\n`

  // Issues
  report += "Issues Detected:\n"
  if (analysis.issues.length === 0) {
    report += "- No issues detected\n"
  } else {
    analysis.issues.forEach((issue, i) => {
      report += `- ${i + 1}. ${issue}\n`
    })
  }
  report += "\n"

  // Recommendations
  report += "Recommendations:\n"
  if (analysis.recommendations.length === 0) {
    report += "- No specific recommendations\n"
  } else {
    analysis.recommendations.forEach((rec, i) => {
      report += `- ${i + 1}. ${rec}\n`
    })
  }

  return report
}

export const generatePDFDiagnostics = generatePDFDiagnosticsReport
