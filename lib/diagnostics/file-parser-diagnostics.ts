/**
 * Diagnostic utilities for troubleshooting file parsing issues
 */

// Log detailed file information
export async function diagnoseFile(file: File): Promise<Record<string, any>> {
  try {
    // Basic file info
    const fileInfo = {
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      extension: file.name.split(".").pop()?.toLowerCase() || "unknown",
    }

    // Check file signature (first few bytes)
    const signatureInfo = await checkFileSignature(file)

    // Try different reading methods
    const readingTests = await testFileReadingMethods(file)

    return {
      fileInfo,
      signatureInfo,
      readingTests,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }
  }
}

// Check file signature to identify file type
async function checkFileSignature(file: File): Promise<Record<string, any>> {
  try {
    // Read first 8 bytes
    const buffer = await file.slice(0, 8).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Convert to hex for signature checking
    const hexSignature = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    // Convert to ASCII for text signature checking
    let asciiSignature = ""
    for (let i = 0; i < Math.min(bytes.length, 8); i++) {
      if (bytes[i] >= 32 && bytes[i] <= 126) {
        asciiSignature += String.fromCharCode(bytes[i])
      } else {
        asciiSignature += "."
      }
    }

    // Check for known signatures
    let detectedType = "unknown"
    if (asciiSignature.startsWith("%PDF")) {
      detectedType = "pdf"
    } else if (hexSignature.startsWith("504b")) {
      detectedType = "zip-based (possibly docx)"
    } else if (asciiSignature.match(/^\w+$/)) {
      detectedType = "text-based"
    }

    return {
      hexSignature,
      asciiSignature,
      detectedType,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error during signature check",
    }
  }
}

// Test different file reading methods
async function testFileReadingMethods(file: File): Promise<Record<string, any>> {
  const results: Record<string, any> = {}

  // Test readAsText
  try {
    const textContent = await readAsTextPromise(file)
    results.readAsText = {
      success: true,
      length: textContent.length,
      sample: textContent.substring(0, 100) + (textContent.length > 100 ? "..." : ""),
      isBinary: isBinaryContent(textContent),
    }
  } catch (error) {
    results.readAsText = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  // Test readAsArrayBuffer
  try {
    const arrayBuffer = await readAsArrayBufferPromise(file)
    const uint8Array = new Uint8Array(arrayBuffer)

    // Try to extract text from binary
    let extractedText = ""
    let textChunks = 0
    let currentChunk = ""

    for (let i = 0; i < uint8Array.length; i++) {
      const byte = uint8Array[i]
      if (byte >= 32 && byte <= 126) {
        // Printable ASCII
        currentChunk += String.fromCharCode(byte)
      } else if (byte === 10 || byte === 13) {
        // Newlines
        currentChunk += "\n"
      } else {
        if (currentChunk.length > 3) {
          // Only keep chunks with some content
          extractedText += currentChunk + " "
          textChunks++
        }
        currentChunk = ""
      }

      // Limit processing for large files
      if (i > 100000) break
    }

    results.readAsArrayBuffer = {
      success: true,
      byteLength: arrayBuffer.byteLength,
      textChunks,
      extractedTextSample: extractedText.substring(0, 100) + (extractedText.length > 100 ? "..." : ""),
    }
  } catch (error) {
    results.readAsArrayBuffer = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  // Test readAsDataURL
  try {
    const dataUrl = await readAsDataURLPromise(file)
    results.readAsDataURL = {
      success: true,
      length: dataUrl.length,
      prefix: dataUrl.substring(0, 30) + "...",
    }
  } catch (error) {
    results.readAsDataURL = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  return results
}

// Check if content appears to be binary
function isBinaryContent(content: string): boolean {
  // Check first 1000 characters
  const checkLength = Math.min(content.length, 1000)
  let binaryCount = 0

  for (let i = 0; i < checkLength; i++) {
    const code = content.charCodeAt(i)
    // Count characters outside normal text range (excluding common whitespace)
    if ((code < 32 || code > 126) && ![9, 10, 13].includes(code)) {
      binaryCount++
    }
  }

  // If more than 10% is binary, consider it binary content
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

// Promise wrapper for FileReader.readAsDataURL
function readAsDataURLPromise(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read file as data URL"))
    reader.readAsDataURL(file)
  })
}
