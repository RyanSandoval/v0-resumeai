/**
 * File type detection utilities
 */

/**
 * Detect file type based on content
 */
export async function detectFileType(file: File): Promise<string> {
  try {
    // First check by file extension
    const extension = file.name.split(".").pop()?.toLowerCase()

    // If we have a known extension, use it
    if (extension && ["pdf", "docx", "txt"].includes(extension)) {
      return extension
    }

    // Otherwise, try to detect by content
    const buffer = await file.slice(0, 8).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Convert to hex for signature checking
    const hexSignature = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    // Check for PDF signature (%PDF)
    if (hexSignature.startsWith("255044462d")) {
      return "pdf"
    }

    // Check for DOCX/ZIP signature (PK)
    if (hexSignature.startsWith("504b")) {
      return "docx"
    }

    // If no binary signatures match, assume text
    return "txt"
  } catch (error) {
    console.error("Error detecting file type:", error)
    return "unknown"
  }
}

/**
 * Check if file is a PDF
 */
export async function isPDF(file: File): Promise<boolean> {
  const fileType = await detectFileType(file)
  return fileType === "pdf"
}

/**
 * Check if file is a DOCX
 */
export async function isDOCX(file: File): Promise<boolean> {
  const fileType = await detectFileType(file)
  return fileType === "docx"
}

/**
 * Check if file is a TXT
 */
export async function isTXT(file: File): Promise<boolean> {
  const fileType = await detectFileType(file)
  return fileType === "txt"
}
