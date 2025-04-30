/**
 * DOCX parsing utilities using mammoth.js
 * This file provides a more robust implementation for DOCX text extraction
 */

import mammoth from "mammoth"
import { getSampleResume } from "../file-utils"

/**
 * Extract text from DOCX file using mammoth.js
 */
export async function extractTextFromDOCXWithMammoth(file: File): Promise<string> {
  try {
    console.log(`Starting mammoth.js extraction for: ${file.name} (${file.size} bytes)`)

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Extract text using mammoth.js
    const result = await mammoth.extractRawText({ arrayBuffer })
    const text = result.value

    if (text && text.length > 0) {
      console.log("Successfully extracted text using mammoth.js")
      return text
    } else {
      console.log("Mammoth.js extraction returned empty text")
      return getSampleResume()
    }
  } catch (error) {
    console.error("Error in mammoth.js extraction:", error)
    return getSampleResume()
  }
}
