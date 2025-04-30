/**
 * PDF.js worker setup
 * This file initializes the PDF.js worker
 */

import * as pdfjs from "pdfjs-dist"

// Initialize PDF.js worker
// Use dynamic import for the worker to avoid build issues
const setPdfWorker = async () => {
  if (typeof window !== "undefined") {
    // Only run in browser environment
    const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.mjs")
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
  }
}

// Initialize the worker
setPdfWorker().catch((err) => console.error("Error setting up PDF.js worker:", err))

export default pdfjs
