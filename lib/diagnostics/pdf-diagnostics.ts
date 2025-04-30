/**
 * PDF Diagnostics Tools
 * Advanced utilities for diagnosing PDF parsing issues
 */

// PDF Format validation
export async function validatePDFFormat(file: File): Promise<{
  valid: boolean
  issues: string[]
}> {
  try {
    const buffer = await file.slice(0, 1024).arrayBuffer() // Read first 1KB
    const bytes = new Uint8Array(buffer)
    const header = new TextDecoder().decode(bytes.slice(0, 8))

    const issues: string[] = []

    // Check PDF signature
    if (!header.startsWith("%PDF-")) {
      issues.push("Missing PDF signature: File does not start with %PDF-")
    }

    // Check PDF version
    const versionMatch = header.match(/%PDF-(\d+\.\d+)/)
    if (!versionMatch) {
      issues.push("Invalid PDF version format")
    } else {
      const version = Number.parseFloat(versionMatch[1])
      if (version < 1.0 || version > 2.0) {
        issues.push(`Unusual PDF version: ${version}`)
      }
    }

    // Check for binary content
    let nullByteCount = 0
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 0) nullByteCount++
    }

    if (nullByteCount === 0) {
      issues.push("No null bytes found: This may be a text file disguised as PDF")
    }

    // Check for common PDF structures
    const content = new TextDecoder().decode(bytes)
    if (!content.includes("obj") || !content.includes("endobj")) {
      issues.push("Missing basic PDF structure markers (obj/endobj)")
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  } catch (error) {
    return {
      valid: false,
      issues: [`Error validating PDF format: ${error instanceof Error ? error.message : "Unknown error"}`],
    }
  }
}

// Get browser PDF support information
export function getBrowserPDFSupport(): {
  supported: boolean
  features: Record<string, boolean>
} {
  if (typeof window === "undefined") {
    return {
      supported: false,
      features: {
        available: false,
      },
    }
  }

  const features: Record<string, boolean> = {
    // Core features
    fileReader: "FileReader" in window,
    blob: "Blob" in window,
    arrayBuffer: "ArrayBuffer" in window,

    // PDF-related
    pdfViewer: "navigator" in window && "pdfViewerEnabled" in navigator,

    // Canvas (used by PDF.js)
    canvas: "HTMLCanvasElement" in window,
    canvasText: false,

    // WebAssembly (used by some PDF.js features)
    webAssembly: "WebAssembly" in window,
  }

  // Test canvas text support
  if (features.canvas) {
    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      features.canvasText = ctx !== null && typeof ctx?.fillText === "function"
    } catch (e) {
      features.canvasText = false
    }
  }

  // Calculate overall support
  const criticalFeatures = ["fileReader", "blob", "arrayBuffer", "canvas"]
  const supported = criticalFeatures.every((feature) => features[feature])

  return {
    supported,
    features,
  }
}

// Check for memory issues
export function checkMemoryAvailability(): boolean {
  if (typeof performance !== "undefined" && "memory" in performance) {
    // @ts-ignore - Some browsers expose memory info
    const memory = performance.memory
    if (memory && memory.jsHeapSizeLimit) {
      // If heap size is less than 100MB, we might have issues with large PDFs
      return memory.jsHeapSizeLimit > 100 * 1024 * 1024
    }
  }

  // If we can't check, assume it's OK
  return true
}

// Generate diagnostic report for PDF processing
export async function generatePDFDiagnostics(file: File): Promise<string> {
  const formatValidation = await validatePDFFormat(file)
  const browserSupport = getBrowserPDFSupport()
  const memoryOK = checkMemoryAvailability()

  let report = "=== PDF DIAGNOSTICS REPORT ===\n\n"

  // File information
  report += `File name: ${file.name}\n`
  report += `File size: ${(file.size / 1024).toFixed(2)} KB\n`
  report += `File type: ${file.type}\n\n`

  // Format validation
  report += `PDF format valid: ${formatValidation.valid}\n`
  if (formatValidation.issues.length > 0) {
    report += "Issues found:\n"
    formatValidation.issues.forEach((issue, i) => {
      report += `  ${i + 1}. ${issue}\n`
    })
  } else {
    report += "No format issues detected\n"
  }
  report += "\n"

  // Browser support
  report += `PDF support in browser: ${browserSupport.supported}\n`
  report += "Feature detection:\n"
  for (const [feature, supported] of Object.entries(browserSupport.features)) {
    report += `  - ${feature}: ${supported}\n`
  }
  report += "\n"

  // Memory
  report += `Memory availability: ${memoryOK ? "Adequate" : "Limited"}\n\n`

  // Environment
  report += "Environment:\n"
  if (typeof window !== "undefined") {
    report += `  - User Agent: ${navigator.userAgent}\n`
    report += `  - Platform: ${navigator.platform}\n`
    report += `  - Language: ${navigator.language}\n`
  } else {
    report += "  Not running in browser\n"
  }

  return report
}
