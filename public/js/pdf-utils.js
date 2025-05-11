/**
 * PDF Utilities for Resume Optimizer
 */

// Import PDF.js library
import * as pdfjsLib from "pdfjs-dist"
// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js"

/**
 * Extracts text from a PDF file
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ""

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const textItems = textContent.items.map((item) => item.str)
      fullText += textItems.join(" ") + "\n"
    }

    return fullText
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    throw new Error("Failed to extract text from PDF. Please try again or use a different file.")
  }
}

/**
 * Creates a basic PDF from resume text with optimization suggestions
 * @param {string} resumeText - Original resume text
 * @param {Object} analysis - Analysis results
 * @returns {Promise<Blob>} - PDF blob for download
 */
async function createOptimizedPDF(resumeText, analysis) {
  // This is a placeholder function
  // In a real application, you would use a proper PDF generation library
  // For this demo, we'll just create a simple HTML document and convert it to PDF

  alert("In a full implementation, this would generate an optimized PDF with your resume and suggestions.")

  // For now, just return the original text as a text file
  const blob = new Blob(
    [
      `RESUME OPTIMIZATION REPORT\n\n` +
        `Match Score: ${analysis.score}%\n\n` +
        `SUGGESTIONS:\n` +
        analysis.suggestions.join("\n") +
        "\n\n" +
        `MISSING KEYWORDS:\n` +
        analysis.missingKeywords.join(", ") +
        "\n\n" +
        `ORIGINAL RESUME:\n` +
        resumeText,
    ],
    { type: "text/plain" },
  )

  return blob
}

/**
 * Simple function to highlight keywords in text
 * @param {string} text - Text to highlight keywords in
 * @param {Array} keywords - Keywords to highlight
 * @returns {string} - HTML with highlighted keywords
 */
function highlightKeywords(text, keywords) {
  if (!keywords || keywords.length === 0 || !text) {
    return text
  }

  let highlightedText = text

  // Create a regex pattern from the keywords
  // This is a simple implementation and has limitations
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi")
    highlightedText = highlightedText.replace(regex, (match) => `<span class="highlight">${match}</span>`)
  })

  return highlightedText
}
