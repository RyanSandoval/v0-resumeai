/**
 * Document utilities for handling file extraction
 */

// Declare pdfjsLib and mammoth variables
let pdfjsLib
let mammoth

// PDF extraction function
window.extractTextFromPDF = async (file) =>
  new Promise((resolve, reject) => {
    try {
      // Check if pdfjsLib is available
      if (typeof pdfjsLib === "undefined") {
        console.warn("PDF.js library not found, loading dynamically")

        // Dynamically load PDF.js if not available
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.min.js"
        script.onload = () => {
          // Set worker source
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js"
          extractPDFText(file).then(resolve).catch(reject)
        }
        script.onerror = () => reject(new Error("Failed to load PDF.js library"))
        document.head.appendChild(script)
      } else {
        // PDF.js is already loaded
        extractPDFText(file).then(resolve).catch(reject)
      }
    } catch (error) {
      reject(new Error(`PDF extraction error: ${error.message}`))
    }
  })

// Helper function to extract text from PDF using PDF.js
async function extractPDFText(file) {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ""

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item) => item.str).join(" ")
      fullText += pageText + "\n"
    }

    if (!fullText || fullText.trim().length < 50) {
      throw new Error("Could not extract sufficient text from PDF")
    }

    return fullText
  } catch (error) {
    console.error("PDF extraction failed:", error)
    throw new Error(`Failed to extract text from PDF: ${error.message}`)
  }
}

// DOCX extraction function
window.extractTextFromDOCX = async (file) =>
  new Promise((resolve, reject) => {
    try {
      // Check if mammoth is available
      if (typeof mammoth === "undefined") {
        console.warn("Mammoth.js library not found, loading dynamically")

        // Dynamically load Mammoth.js if not available
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.21/mammoth.browser.min.js"
        script.onload = () => {
          extractDOCXText(file).then(resolve).catch(reject)
        }
        script.onerror = () => reject(new Error("Failed to load Mammoth.js library"))
        document.head.appendChild(script)
      } else {
        // Mammoth.js is already loaded
        extractDOCXText(file).then(resolve).catch(reject)
      }
    } catch (error) {
      reject(new Error(`DOCX extraction error: ${error.message}`))
    }
  })

// Helper function to extract text from DOCX using Mammoth.js
async function extractDOCXText(file) {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Extract text using Mammoth.js
    const result = await mammoth.extractRawText({ arrayBuffer })
    const text = result.value

    if (!text || text.trim().length < 50) {
      throw new Error("Could not extract sufficient text from DOCX")
    }

    return text
  } catch (error) {
    console.error("DOCX extraction failed:", error)
    throw new Error(`Failed to extract text from DOCX: ${error.message}`)
  }
}

// Fallback text extraction for any file type
window.extractTextFromAnyFile = async (file) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()

      reader.onload = (e) => {
        const text = e.target.result
        if (!text || text.trim().length < 10) {
          reject(new Error("Could not extract text from file"))
        } else {
          resolve(text)
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    } catch (error) {
      reject(new Error(`Text extraction error: ${error.message}`))
    }
  })

// File type detection
window.detectFileType = (file) => {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith(".pdf")) {
    return "pdf"
  } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
    return "docx"
  } else if (fileName.endsWith(".txt") || fileName.endsWith(".rtf")) {
    return "txt"
  } else {
    // Try to detect by MIME type
    const mimeType = file.type.toLowerCase()

    if (mimeType.includes("pdf")) {
      return "pdf"
    } else if (mimeType.includes("word") || mimeType.includes("officedocument")) {
      return "docx"
    } else if (mimeType.includes("text")) {
      return "txt"
    }
  }

  return "unknown"
}
