/**
 * File type detection utilities
 */

/**
 * Detect file type based on content
 */
export async function detectFileType(file: File): Promise<string> {
  try {
    console.log(`Detecting file type for: ${file.name} (${file.size} bytes)`)

    // First check by file extension
    const extension = file.name.split(".").pop()?.toLowerCase()

    // If we have a known extension, use it but verify with content check
    if (extension && ["pdf", "docx", "txt"].includes(extension)) {
      // For PDFs, do an additional signature check to confirm
      if (extension === "pdf") {
        const isPdfBySignature = await checkPdfSignature(file)
        if (isPdfBySignature) {
          console.log("File confirmed as PDF by signature")
          return "pdf"
        } else {
          console.log("File has PDF extension but signature doesn't match, performing deeper check")
        }
      } else {
        // For other formats, trust the extension
        return extension
      }
    }

    // Perform deeper content analysis
    const buffer = await file.slice(0, 8).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Convert to hex for signature checking
    const hexSignature = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    console.log(`File signature: ${hexSignature}`)

    // Check for PDF signature (%PDF)
    if (hexSignature.startsWith("255044462d") || hexSignature.includes("255044462d")) {
      console.log("PDF signature detected")
      return "pdf"
    }

    // Check for DOCX/ZIP signature (PK)
    if (hexSignature.startsWith("504b")) {
      console.log("DOCX/ZIP signature detected")
      return "docx"
    }

    // If no binary signatures match, check MIME type
    if (file.type === "application/pdf") {
      console.log("PDF MIME type detected")
      return "pdf"
    }

    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      console.log("DOCX MIME type detected")
      return "docx"
    }

    // If all else fails, assume text
    console.log("No specific format detected, defaulting to TXT")
    return "txt"
  } catch (error) {
    console.error("Error detecting file type:", error)
    // Default to the file extension if available
    const extension = file.name.split(".").pop()?.toLowerCase()
    if (extension && ["pdf", "docx", "txt"].includes(extension)) {
      return extension
    }
    return "unknown"
  }
}

/**
 * Check for PDF signature in file
 */
async function checkPdfSignature(file: File): Promise<boolean> {
  try {
    // Read the first 1024 bytes to look for PDF signature
    const buffer = await file.slice(0, 1024).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Convert to text to search for %PDF
    const textDecoder = new TextDecoder("ascii")
    const headerText = textDecoder.decode(bytes)

    // Check for PDF header
    return headerText.includes("%PDF-")
  } catch (error) {
    console.error("Error checking PDF signature:", error)
    return false
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
