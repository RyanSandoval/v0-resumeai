/**
 * Debug utilities for troubleshooting file processing issues
 */

// Log file information
export function logFileInfo(file: File): void {
  if (!file) {
    console.log("No file provided")
    return
  }

  console.log("File Information:", {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024).toFixed(2)} KB`,
    lastModified: new Date(file.lastModified).toISOString(),
  })
}

// Check if file content is binary
export async function checkIfBinary(file: File): Promise<boolean> {
  try {
    // Read the first 100 bytes
    const buffer = await file.slice(0, 100).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Check for binary content (non-printable ASCII characters)
    for (let i = 0; i < bytes.length; i++) {
      // Check for control characters (except tabs, newlines, etc.)
      if ((bytes[i] < 32 || bytes[i] > 126) && ![9, 10, 13].includes(bytes[i])) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking if file is binary:", error)
    return false
  }
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || ""
}

// Check if file is supported
export function isSupportedFileType(file: File): boolean {
  const extension = getFileExtension(file.name)
  return ["pdf", "docx", "txt"].includes(extension)
}

// Log file processing attempt
export function logProcessingAttempt(file: File, method: string): void {
  console.log(`Attempting to process ${file.name} using ${method}`)
}

// Log file processing result
export function logProcessingResult(success: boolean, text: string, method: string): void {
  if (success) {
    console.log(`Successfully processed file using ${method}`)
    console.log(`Extracted ${text.length} characters`)
    console.log(`Sample: ${text.substring(0, 100)}...`)
  } else {
    console.log(`Failed to process file using ${method}`)
    console.log(`Error: ${text || "No text extracted"}`)
  }
}
