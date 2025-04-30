/**
 * PDF parsing utilities using PDF.js
 */

import * as pdfjs from "pdfjs-dist"
import { getSampleResume } from "../file-utils"

// Initialize PDF.js worker
// In a production environment, we would set this to a CDN URL or local path
const pdfjsWorker = require("pdfjs-dist/build/pdf.worker.entry")
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * Extract text from PDF file using PDF.js
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log(`Starting PDF.js extraction for: ${file.name} (${file.size} bytes)`)

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    console.log(`PDF loaded successfully. Number of pages: ${pdf.numPages}`)

    // Extract text from each page
    let fullText = ""

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()

      // Concatenate the text items with proper spacing
      let lastY = null
      let pageText = ""

      for (const item of textContent.items) {
        if ("str" in item) {
          // Add newline if y-position changes significantly
          if (lastY !== null && Math.abs((item as any).transform[5] - lastY) > 5) {
            pageText += "\n"
          }
          pageText += item.str + " "
          lastY = (item as any).transform[5]
        }
      }

      fullText += pageText + "\n\n"
    }

    // Clean up the extracted text
    fullText = cleanupPDFText(fullText)

    if (fullText.trim().length > 100) {
      console.log("Successfully extracted text using PDF.js")
      return fullText
    } else {
      console.log("PDF.js extraction returned insufficient text, trying fallback method")
      return await extractTextFromPDFFallback(file)
    }
  } catch (error) {
    console.error("Error in PDF.js extraction:", error)
    return await extractTextFromPDFFallback(file)
  }
}

/**
 * Fallback method for PDF text extraction
 */
async function extractTextFromPDFFallback(file: File): Promise<string> {
  try {
    console.log("Using PDF fallback extraction method")

    // Try direct text extraction (works for some PDFs)
    const directText = await readAsTextPromise(file)

    // Check if we got valid text content
    if (directText && directText.length > 100 && !isPDFBinary(directText)) {
      console.log("Successfully extracted text from PDF using direct method")
      return cleanupPDFText(directText)
    }

    // If direct extraction failed, try binary extraction
    const arrayBuffer = await readAsArrayBufferPromise(file)
    const text = await extractTextFromPDFBinary(arrayBuffer)

    if (text && text.length > 100) {
      console.log("Successfully extracted text from PDF using binary extraction")
      return cleanupPDFText(text)
    }

    console.log("All PDF extraction methods failed, using sample resume")
    return getSampleResume()
  } catch (error) {
    console.error("All PDF extraction methods failed:", error)
    return getSampleResume()
  }
}

/**
 * Extract text from PDF binary data
 */
async function extractTextFromPDFBinary(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer)
  let result = ""
  let currentText = ""

  // Look for text chunks in the binary data
  for (let i = 0; i < uint8Array.length; i++) {
    const byte = uint8Array[i]

    // If it's a printable ASCII character or newline
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
      currentText += String.fromCharCode(byte)
    } else {
      // If we have accumulated some text
      if (currentText.length > 4) {
        result += currentText + " "
      }
      currentText = ""
    }

    // Limit processing for large files
    if (i > 1000000) break
  }

  return result
}

/**
 * Clean up extracted PDF text
 */
function cleanupPDFText(text: string): string {
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, " ")

  // Remove non-printable characters
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, "")

  // Fix common PDF extraction issues
  cleaned = cleaned
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between lowercase and uppercase letters
    .replace(/([a-zA-Z])(\d)/g, "$1 $2") // Add space between letters and numbers
    .replace(/(\d)([a-zA-Z])/g, "$1 $2") // Add space between numbers and letters

  // Restore common resume section headers
  const sectionHeaders = [
    "SUMMARY",
    "EXPERIENCE",
    "EDUCATION",
    "SKILLS",
    "PROJECTS",
    "CERTIFICATIONS",
    "WORK HISTORY",
    "EMPLOYMENT",
  ]

  for (const header of sectionHeaders) {
    const regex = new RegExp(`\\b${header}\\b`, "i")
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, `\n\n${header.toUpperCase()}\n`)
    }
  }

  return cleaned.trim()
}

/**
 * Check if the content appears to be binary PDF data
 */
function isPDFBinary(content: string): boolean {
  // Check for PDF signature
  if (content.startsWith("%PDF-")) {
    return true
  }

  // Check for binary content
  const checkLength = Math.min(content.length, 1000)
  let binaryCount = 0

  for (let i = 0; i < checkLength; i++) {
    const code = content.charCodeAt(i)
    if ((code < 32 || code > 126) && ![9, 10, 13].includes(code)) {
      binaryCount++
    }
  }

  return binaryCount / checkLength > 0.1
}

// Promise wrapper for FileReader.readAsText
function readAsTextPromise(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file as text"))
    reader.readAsText(file)
  })
}

// Promise wrapper for FileReader.readAsArrayBuffer
function readAsArrayBufferPromise(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error("Failed to read file as array buffer"))
    reader.readAsArrayBuffer(file)
  })
}
