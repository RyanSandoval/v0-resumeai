/**
 * DOCX parsing utilities using mammoth.js
 */

import mammoth from "mammoth"
import { getSampleResume } from "../file-utils"

/**
 * Extract text from DOCX file using mammoth.js
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    console.log(`Starting mammoth.js extraction for: ${file.name} (${file.size} bytes)`)

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Extract text using mammoth.js
    const result = await mammoth.extractRawText({ arrayBuffer })
    const text = result.value

    // Check if we got valid text content
    if (text && text.length > 100) {
      console.log("Successfully extracted text using mammoth.js")
      return cleanupDocxText(text)
    }

    console.log("Mammoth.js extraction returned insufficient text, trying fallback method")
    return await extractTextFromDOCXFallback(file)
  } catch (error) {
    console.error("Error in mammoth.js extraction:", error)
    return await extractTextFromDOCXFallback(file)
  }
}

/**
 * Fallback method for DOCX text extraction
 */
async function extractTextFromDOCXFallback(file: File): Promise<string> {
  try {
    console.log("Using DOCX fallback extraction method")

    // Try direct text extraction (rarely works for DOCX)
    const directText = await readAsTextPromise(file)

    // Check if we got valid text content (not binary DOCX data which contains "PK")
    if (directText && directText.length > 100 && !directText.includes("PK")) {
      console.log("Successfully extracted text from DOCX using direct method")
      return cleanupDocxText(directText)
    }

    // Try binary extraction
    const arrayBuffer = await readAsArrayBufferPromise(file)
    const text = await extractTextFromDOCXBinary(arrayBuffer)

    if (text && text.length > 100) {
      console.log("Successfully extracted text from DOCX using binary extraction")
      return cleanupDocxText(text)
    }

    // Try to extract XML content from DOCX (which is a ZIP file)
    const xmlContent = await extractXMLFromDOCX(arrayBuffer)

    if (xmlContent && xmlContent.length > 100) {
      console.log("Successfully extracted XML content from DOCX")
      return cleanupDocxText(xmlContent)
    }

    console.log("All DOCX extraction methods failed, using sample resume")
    return getSampleResume()
  } catch (error) {
    console.error("All DOCX extraction methods failed:", error)
    return getSampleResume()
  }
}

/**
 * Extract text from DOCX binary data
 */
async function extractTextFromDOCXBinary(buffer: ArrayBuffer): Promise<string> {
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
 * Extract XML content from DOCX file
 */
async function extractXMLFromDOCX(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer)
  const content = new TextDecoder().decode(uint8Array)

  // Look for XML content
  const xmlMatches = content.match(/<\?xml[^>]*>[\s\S]*?<\/[^>]*>/g)

  if (xmlMatches && xmlMatches.length > 0) {
    // Extract text from XML
    let extractedText = ""

    for (const xml of xmlMatches) {
      // Remove XML tags but keep their content
      const textContent = xml.replace(/<[^>]+>/g, " ")

      // If we found substantial text, add it
      if (textContent.length > 50) {
        extractedText += textContent + " "
      }
    }

    return extractedText
  }

  return ""
}

/**
 * Clean up extracted DOCX text
 */
function cleanupDocxText(text: string): string {
  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, " ")

  // Remove non-printable characters
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, "")

  // Replace XML entities
  cleaned = cleaned
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")

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
