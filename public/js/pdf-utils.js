/**
 * PDF Utilities for Resume Optimizer
 */

// Import PDF.js library
import * as pdfjsLib from "pdfjs-dist"
// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js"

/**
 * Extracts text from a PDF file
 * @param {File} file - The PDF file
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromPDF(file) {
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    // Get total number of pages
    const numPages = pdf.numPages
    let fullText = ""

    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()

      // Join the text items
      const pageText = textContent.items.map((item) => item.str).join(" ")

      fullText += pageText + "\n\n"
    }

    return fullText
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    throw new Error("Failed to extract text from PDF. Please try another file.")
  }
}

/**
 * Highlights keywords in text
 * @param {string} text - The text to highlight
 * @param {Array} keywords - Keywords to highlight
 * @returns {string} - HTML with highlighted keywords
 */
function highlightKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return text

  // Escape HTML special characters
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

  // Sort keywords by length (longest first) to avoid partial matches
  const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length)

  // Create a regex pattern for all keywords
  const pattern = sortedKeywords.map((keyword) => escapeRegExp(keyword)).join("|")

  // Only proceed if we have keywords to highlight
  if (pattern) {
    const regex = new RegExp(`\\b(${pattern})\\b`, "gi")
    safeText = safeText.replace(regex, '<span class="highlight">$1</span>')
  }

  // Convert newlines to <br> tags
  return safeText.replace(/\n/g, "<br>")
}

/**
 * Escapes special characters in a string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Creates an optimized version of the resume text
 * @param {string} resumeText - The original resume text
 * @param {Object} analysisResults - The analysis results
 * @returns {Promise<Blob>} - A Blob containing the optimized resume
 */
async function createOptimizedPDF(resumeText, analysisResults) {
  // For now, we'll just create a text file with suggestions
  // In a more advanced version, this would generate an actual PDF

  const missingKeywords = analysisResults.missingKeywords || []
  const suggestions = analysisResults.suggestions || []

  let optimizedText = "RESUME OPTIMIZATION REPORT\n"
  optimizedText += "==========================\n\n"

  optimizedText += `Match Score: ${analysisResults.score}%\n\n`

  optimizedText += "MISSING KEYWORDS:\n"
  optimizedText += "----------------\n"
  if (missingKeywords.length > 0) {
    missingKeywords.forEach((keyword) => {
      optimizedText += `- ${keyword}\n`
    })
  } else {
    optimizedText += "No missing keywords found.\n"
  }

  optimizedText += "\nSUGGESTIONS:\n"
  optimizedText += "-----------\n"
  if (suggestions.length > 0) {
    suggestions.forEach((suggestion) => {
      optimizedText += `- ${suggestion}\n`
    })
  } else {
    optimizedText += "No suggestions available.\n"
  }

  optimizedText += "\nORIGINAL RESUME TEXT:\n"
  optimizedText += "--------------------\n"
  optimizedText += resumeText

  // Create a Blob with the text
  return new Blob([optimizedText], { type: "text/plain" })
}

// Export functions to global scope for use in other scripts
window.extractTextFromPDF = extractTextFromPDF
window.highlightKeywords = highlightKeywords
window.createOptimizedPDF = createOptimizedPDF
