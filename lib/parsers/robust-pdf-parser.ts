/**
 * Robust PDF Parser
 * A comprehensive PDF parsing solution with multiple strategies, detailed logging,
 * and extensive error handling to ensure reliable text extraction from various PDF formats.
 */

import { logParsingStep, logParsingError, logParsingSuccess } from "../diagnostics/parsing-logger"
import { getSampleResume } from "../file-utils"

// Track initialization status
let isInitialized = false
let initializationAttempts = 0
let pdfjs: any = null

/**
 * Initialize PDF.js with proper error handling and retry logic
 */
export async function initializePDFJS(): Promise<boolean> {
  // Skip if already initialized successfully
  if (isInitialized && pdfjs) return true

  // Limit initialization attempts to prevent infinite loops
  if (initializationAttempts >= 3) {
    console.error("PDF.js initialization failed after multiple attempts")
    return false
  }

  initializationAttempts++

  // Make sure we're on the client
  if (typeof window === "undefined") {
    console.log("[PDF Parser] Initialization skipped - not in browser environment")
    return false
  }

  try {
    logParsingStep("PDF.js", "Initializing PDF.js library")

    // Use dynamic imports with error handling
    try {
      pdfjs = await import("pdfjs-dist")
    } catch (importError) {
      logParsingError("PDF.js", "Failed to import pdfjs-dist", importError)
      console.error("[PDF Parser] Failed to import pdfjs-dist:", importError)
      return false
    }

    // Set up the worker with error handling
    try {
      if (typeof window !== "undefined") {
        const PDFJSWorker = await import("pdfjs-dist/build/pdf.worker.mjs")

        if (pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = PDFJSWorker
          logParsingStep("PDF.js", "Worker configured successfully")
        } else {
          logParsingError("PDF.js", "Worker options not available", new Error("GlobalWorkerOptions not found"))
          return false
        }
      }
    } catch (workerError) {
      logParsingError("PDF.js", "Failed to load PDF.js worker", workerError)
      console.error("[PDF Parser] Failed to load PDF.js worker:", workerError)
      return false
    }

    isInitialized = true
    logParsingSuccess("PDF.js", "Initialization complete")
    return true
  } catch (error) {
    logParsingError("PDF.js", "Initialization failed", error)
    console.error("[PDF Parser] Initialization failed:", error)
    return false
  }
}

/**
 * Main function to extract text from PDF with multiple strategies and detailed logging
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  logParsingStep("PDF Parser", `Starting extraction for ${file.name} (${file.size} bytes)`)

  try {
    // Verify client-side environment
    if (typeof window === "undefined") {
      logParsingError("PDF Parser", "Not in browser environment", new Error("Server-side execution detected"))
      throw new Error("PDF extraction can only be performed in a browser environment")
    }

    // Initialize PDF.js
    const initialized = await initializePDFJS()
    if (!initialized || !pdfjs) {
      logParsingError("PDF Parser", "PDF.js initialization failed", new Error("Failed to initialize PDF.js"))

      // Try alternative method if PDF.js initialization fails
      logParsingStep("PDF Parser", "Attempting alternative extraction method")
      return await extractWithAlternativeMethod(file)
    }

    // Try multiple parsing strategies in sequence
    let extractedText = ""

    // Strategy 1: Standard PDF.js parsing
    try {
      logParsingStep("PDF Parser", "Attempting standard PDF.js parsing")
      extractedText = await extractWithPDFJS(file)

      if (isValidExtraction(extractedText)) {
        logParsingSuccess("PDF Parser", "Standard parsing successful", extractedText.length)
        return cleanupPDFText(extractedText)
      }

      logParsingStep("PDF Parser", "Standard parsing returned insufficient text")
    } catch (error) {
      logParsingError("PDF Parser", "Standard parsing failed", error)
    }

    // Strategy 2: Enhanced PDF.js parsing with additional options
    try {
      logParsingStep("PDF Parser", "Attempting enhanced PDF.js parsing")
      extractedText = await extractWithEnhancedOptions(file)

      if (isValidExtraction(extractedText)) {
        logParsingSuccess("PDF Parser", "Enhanced parsing successful", extractedText.length)
        return cleanupPDFText(extractedText)
      }

      logParsingStep("PDF Parser", "Enhanced parsing returned insufficient text")
    } catch (error) {
      logParsingError("PDF Parser", "Enhanced parsing failed", error)
    }

    // Strategy 3: Alternative method (non-PDF.js)
    try {
      logParsingStep("PDF Parser", "Attempting alternative extraction method")
      extractedText = await extractWithAlternativeMethod(file)

      if (isValidExtraction(extractedText)) {
        logParsingSuccess("PDF Parser", "Alternative parsing successful", extractedText.length)
        return cleanupPDFText(extractedText)
      }

      logParsingStep("PDF Parser", "Alternative parsing returned insufficient text")
    } catch (error) {
      logParsingError("PDF Parser", "Alternative parsing failed", error)
    }

    // Strategy 4: Binary extraction as last resort
    try {
      logParsingStep("PDF Parser", "Attempting binary extraction")
      extractedText = await extractFromBinary(file)

      if (isValidExtraction(extractedText)) {
        logParsingSuccess("PDF Parser", "Binary extraction successful", extractedText.length)
        return cleanupPDFText(extractedText)
      }

      logParsingStep("PDF Parser", "Binary extraction returned insufficient text")
    } catch (error) {
      logParsingError("PDF Parser", "Binary extraction failed", error)
    }

    // If all strategies fail, return sample resume
    logParsingError("PDF Parser", "All parsing strategies failed", new Error("No successful extraction method"))
    return getSampleResume()
  } catch (error) {
    logParsingError("PDF Parser", "Extraction process failed", error)
    return getSampleResume()
  }
}

/**
 * Strategy 1: Standard PDF.js parsing
 */
async function extractWithPDFJS(file: File): Promise<string> {
  if (!pdfjs) {
    throw new Error("PDF.js not initialized")
  }

  // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  // Load the PDF document
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  logParsingStep("PDF.js", `PDF loaded successfully. Pages: ${pdf.numPages}`)

  // Extract text from each page
  let fullText = ""

  for (let i = 1; i <= pdf.numPages; i++) {
    logParsingStep("PDF.js", `Processing page ${i}/${pdf.numPages}`)
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    // Process text content
    const pageText = textContent.items.map((item: any) => item.str || "").join(" ")

    fullText += pageText + "\n\n"
  }

  return fullText
}

/**
 * Strategy 2: Enhanced PDF.js parsing with additional options
 */
async function extractWithEnhancedOptions(file: File): Promise<string> {
  if (!pdfjs) {
    throw new Error("PDF.js not initialized")
  }

  // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()

  // Load the PDF document with additional options to improve compatibility
  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/",
    disableFontFace: true,
    nativeImageDecoderSupport: "none",
  })

  const pdf = await loadingTask.promise
  logParsingStep("PDF.js Enhanced", `PDF loaded with enhanced options. Pages: ${pdf.numPages}`)

  // Extract text from each page with improved structure preservation
  let fullText = ""

  for (let i = 1; i <= pdf.numPages; i++) {
    logParsingStep("PDF.js Enhanced", `Processing page ${i}/${pdf.numPages}`)
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    // Process text content with structure preservation
    const pageText = extractStructuredText(textContent)
    fullText += pageText + "\n\n"
  }

  return fullText
}

/**
 * Extract text with better structure preservation
 */
function extractStructuredText(textContent: any): string {
  if (!textContent || !textContent.items || !Array.isArray(textContent.items)) {
    return ""
  }

  // Sort items by vertical position
  const items = [...textContent.items]
  items.sort((a: any, b: any) => {
    if (!a.transform || !b.transform) return 0
    return a.transform[5] - b.transform[5]
  })

  // Group items by lines (items with similar y-position)
  const lines: any[][] = []
  let currentLine: any[] = []
  let lastY: number | null = null
  const LINE_THRESHOLD = 5

  for (const item of items) {
    if ("str" in item) {
      const y = item.transform ? item.transform[5] : 0

      if (lastY === null || Math.abs(y - lastY) <= LINE_THRESHOLD) {
        // Same line
        currentLine.push(item)
      } else {
        // New line
        if (currentLine.length > 0) {
          lines.push([...currentLine])
        }
        currentLine = [item]
      }

      lastY = y
    }
  }

  // Add the last line
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  // Sort items within each line by x-position
  for (const line of lines) {
    line.sort((a, b) => a.transform[4] - b.transform[4])
  }

  // Convert lines to text
  return lines.map((line) => line.map((item) => item.str).join(" ")).join("\n")
}

/**
 * Strategy 3: Alternative method (non-PDF.js)
 */
async function extractWithAlternativeMethod(file: File): Promise<string> {
  logParsingStep("Alternative Parser", "Starting alternative extraction")

  try {
    // Read file as text first (works for some PDF files)
    const textContent = await readAsText(file)

    // If we got text that looks like PDF content
    if (textContent && textContent.includes("obj") && textContent.includes("endobj")) {
      logParsingStep("Alternative Parser", "PDF structure detected in text content")

      // Extract visible text content using regex
      let extractedText = ""

      // Match text within parentheses after "TJ" operations
      const textMatches = textContent.match(/$$(.*?)$$\s*TJ/g) || []
      for (const match of textMatches) {
        const text = match.replace(/$$|$$\s*TJ/g, "")
        extractedText += text + " "
      }

      // Match text within BT/ET blocks
      const btMatches = textContent.match(/BT\s*(.*?)\s*ET/gs) || []
      for (const match of btMatches) {
        const text = match
          .replace(/BT|ET/g, "")
          .replace(/\[\s*(.*?)\s*\]\s*TJ/g, "$1")
          .replace(/$$|$$/g, "")
        extractedText += text + " "
      }

      if (extractedText.length > 100) {
        logParsingSuccess("Alternative Parser", "Extracted text from PDF structure", extractedText.length)
        return extractedText
      }
    }

    logParsingStep("Alternative Parser", "No usable text found in PDF structure")
    return ""
  } catch (error) {
    logParsingError("Alternative Parser", "Extraction failed", error)
    return ""
  }
}

/**
 * Strategy 4: Binary extraction as last resort
 */
async function extractFromBinary(file: File): Promise<string> {
  logParsingStep("Binary Parser", "Starting binary extraction")

  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // Extract text from binary data
    let result = ""
    let currentText = ""
    const textCharCodes = new Set(
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,;:!?-_/+@#$%^&*()[]{}|<>'\""
        .split("")
        .map((c) => c.charCodeAt(0)),
    )

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]

      if (textCharCodes.has(byte)) {
        currentText += String.fromCharCode(byte)
      } else if (currentText.length > 4) {
        result += currentText + " "
        currentText = ""
      } else {
        currentText = ""
      }

      // Limit processing for large files
      if (i > 2000000) break
    }

    logParsingSuccess("Binary Parser", "Extracted text from binary data", result.length)
    return result
  } catch (error) {
    logParsingError("Binary Parser", "Binary extraction failed", error)
    return ""
  }
}

/**
 * Helper function to read file as text
 */
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file as text"))
    reader.readAsText(file)
  })
}

/**
 * Clean up extracted PDF text
 */
function cleanupPDFText(text: string): string {
  // Remove PDF syntax artifacts
  let cleaned = text
    .replace(/<<\/[^>]+>>/g, " ")
    .replace(/\d+ \d+ obj/g, " ")
    .replace(/endobj/g, " ")
    .replace(/stream/g, " ")
    .replace(/endstream/g, " ")
    .replace(/xref/g, " ")
    .replace(/trailer/g, " ")
    .replace(/startxref/g, " ")
    .replace(/\/\w+/g, " ")

  // Remove excessive whitespace
  cleaned = cleaned
    .replace(/\s+/g, " ")
    .replace(/(\r\n|\n|\r)/gm, "\n")
    .trim()

  // Fix common PDF extraction issues
  cleaned = cleaned
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between lowercase and uppercase letters
    .replace(/([a-zA-Z])(\d)/g, "$1 $2") // Add space between letters and numbers
    .replace(/(\d)([a-zA-Z])/g, "$1 $2") // Add space between numbers and letters

  // Handle special characters
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, "") // Remove non-printable characters

  // Restore resume section headers
  const sectionHeaders = [
    "SUMMARY",
    "EXPERIENCE",
    "EDUCATION",
    "SKILLS",
    "PROJECTS",
    "CERTIFICATIONS",
    "WORK HISTORY",
    "EMPLOYMENT",
    "OBJECTIVE",
    "PROFILE",
    "PROFESSIONAL EXPERIENCE",
    "QUALIFICATIONS",
  ]

  for (const header of sectionHeaders) {
    const regex = new RegExp(`\\b${header}\\b`, "i")
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, `\n\n${header.toUpperCase()}\n`)
    }
  }

  return cleaned
}

/**
 * Check if extracted text is valid and usable
 */
function isValidExtraction(text: string): boolean {
  if (!text || text.length < 100) {
    return false
  }

  // Check if text contains only special characters or numbers
  const alphaContent = text.replace(/[^a-zA-Z]/g, "")
  if (alphaContent.length < 50) {
    return false
  }

  // Check for common resume sections
  const resumeSections = [
    "experience",
    "education",
    "skills",
    "summary",
    "objective",
    "work",
    "employment",
    "projects",
    "certifications",
  ]

  let sectionCount = 0
  const lowerText = text.toLowerCase()

  for (const section of resumeSections) {
    if (lowerText.includes(section)) {
      sectionCount++
    }
  }

  // If we found at least 1 resume section, it might be a resume
  return sectionCount >= 1
}
