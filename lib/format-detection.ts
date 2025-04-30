/**
 * Utilities for detecting file formats and content types
 */

// PDF signature bytes
const PDF_SIGNATURE = "%PDF"

// DOCX is a ZIP file with specific content
const DOCX_SIGNATURE = "PK"

/**
 * Detect file format based on content
 */
export async function detectFileFormat(file: File): Promise<string> {
  try {
    // Read the first few bytes
    const buffer = await file.slice(0, 8).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Convert to string for signature checking
    let signature = ""
    for (let i = 0; i < Math.min(bytes.length, 8); i++) {
      signature += String.fromCharCode(bytes[i])
    }

    // Check for PDF signature
    if (signature.startsWith(PDF_SIGNATURE)) {
      return "pdf"
    }

    // Check for DOCX/ZIP signature
    if (signature.startsWith(DOCX_SIGNATURE)) {
      return "docx"
    }

    // If no binary signatures match, assume text
    return "txt"
  } catch (error) {
    console.error("Error detecting file format:", error)
    return "unknown"
  }
}

/**
 * Check if file content is text or binary
 */
export async function isTextFile(file: File): Promise<boolean> {
  try {
    // Read a sample of the file
    const sample = await file.slice(0, 1024).text()

    // Count binary characters
    let binaryCount = 0
    for (let i = 0; i < sample.length; i++) {
      const code = sample.charCodeAt(i)
      // Check for control characters (except common whitespace)
      if ((code < 32 || code > 126) && ![9, 10, 13].includes(code)) {
        binaryCount++
      }
    }

    // If more than 10% of characters are binary, consider it a binary file
    return binaryCount / sample.length < 0.1
  } catch (error) {
    console.error("Error checking if file is text:", error)
    return false
  }
}

/**
 * Get MIME type based on file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
    rtf: "application/rtf",
    odt: "application/vnd.oasis.opendocument.text",
  }

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream"
}
