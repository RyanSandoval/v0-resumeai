/**
 * PDF.js worker setup
 * This file initializes the PDF.js worker with better error handling
 */

// Only initialize PDF.js in browser environments
let pdfjs: typeof import("pdfjs-dist") | null = null

// Initialize PDF.js worker
if (typeof window !== "undefined") {
  // Dynamically import PDF.js only on the client side
  import("pdfjs-dist")
    .then(async (module) => {
      pdfjs = module

      try {
        // Load the worker
        const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.mjs")
        pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
        console.log("PDF.js worker initialized successfully")
      } catch (err) {
        console.error("Failed to load PDF.js worker:", err)
      }
    })
    .catch((err) => {
      console.error("Failed to load PDF.js:", err)
    })
}

// Export the potentially initialized module
export default pdfjs
