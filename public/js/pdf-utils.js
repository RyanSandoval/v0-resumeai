/**
 * PDF Utilities for Resume Optimizer
 */

;(() => {
  // Declare pdfjsLib in the scope of the module
  const pdfjsLib = window.pdfjsLib

  /**
   * Extracts text from a PDF file
   * @param {File} file - The PDF file
   * @returns {Promise<string>} - The extracted text
   */
  async function extractTextFromPDF(file) {
    try {
      // Check if PDF.js is loaded
      if (!pdfjsLib) {
        throw new Error("PDF.js library not loaded. Please refresh the page and try again.")
      }

      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js"

      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      // Extract text from each page
      let text = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((item) => item.str).join(" ")
        text += pageText + "\n\n"
      }

      return text
    } catch (error) {
      console.error("Error extracting text from PDF:", error)
      throw new Error("Failed to extract text from PDF. Please try another file.")
    }
  }

  /**
   * Creates an optimized PDF from resume text and analysis
   * @param {string} resumeText - The resume text
   * @param {Object} analysis - The analysis results
   * @returns {Blob} - A text file blob (placeholder for PDF)
   */
  function createOptimizedPDF(resumeText, analysis) {
    // This is a placeholder implementation
    // In a real implementation, this would generate a proper PDF

    // For now, we'll just return a text file with suggestions
    const content = [
      "OPTIMIZED RESUME",
      "================",
      "",
      `Match Score: ${analysis.score}%`,
      "",
      "MATCHING KEYWORDS:",
      ...analysis.matchingKeywords.map((k) => `- ${k.text} (${k.frequency}×)`),
      "",
      "MISSING KEYWORDS:",
      ...analysis.missingKeywords.map((k) => `- ${k}`),
      "",
      "SUGGESTIONS:",
      ...analysis.suggestions,
      "",
      "RESUME CONTENT:",
      resumeText,
    ].join("\n")

    return new Blob([content], { type: "text/plain" })
  }

  /**
   * Highlights keywords in text
   * @param {string} text - The text to highlight keywords in
   * @param {Array<Object>} keywords - The keywords to highlight
   * @returns {string} - HTML with highlighted keywords
   */
  function highlightKeywords(text, keywords) {
    if (!text || !keywords || keywords.length === 0) {
      return text
    }

    // Escape HTML special characters
    let highlightedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")

    // Replace newlines with <br> tags
    highlightedText = highlightedText.replace(/\n/g, "<br>")

    // Highlight each keyword
    keywords.forEach((keyword) => {
      const keywordText = typeof keyword === "string" ? keyword : keyword.text
      if (!keywordText) return

      // Escape special characters in the keyword for use in regex
      const escapedKeyword = keywordText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

      // Create regex to match the keyword (case insensitive, word boundaries)
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, "gi")

      // Replace with highlighted version
      highlightedText = highlightedText.replace(regex, (match) => `<span class="highlight">${match}</span>`)
    })

    return highlightedText
  }

  // Expose functions to global scope
  window.extractTextFromPDF = extractTextFromPDF
  window.createOptimizedPDF = createOptimizedPDF
  window.highlightKeywords = highlightKeywords
})()

/**
 * PDF Utilities for Resume Optimizer
 * This script provides PDF generation and manipulation functionality
 */

// Check if jsPDF is available
const hasPdfLibrary = typeof jspdf !== "undefined" && typeof jspdf.jsPDF !== "undefined"

// Generate PDF from resume content
function generateResumePdf(resumeContent, filename = "optimized-resume.pdf") {
  if (!hasPdfLibrary) {
    console.error("jsPDF library not available. Cannot generate PDF.")
    alert("PDF generation is not available. Please install jsPDF library.")
    return false
  }

  try {
    // Create new PDF document
    const { jsPDF } = jspdf
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Set font
    doc.setFont("helvetica")

    // Add content
    const margin = 20
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2

    // Split text into lines to fit page width
    const textLines = doc.splitTextToSize(resumeContent, pageWidth)

    // Add text to document
    doc.setFontSize(12)
    doc.text(textLines, margin, margin)

    // Save the PDF
    doc.save(filename)

    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("Error generating PDF. Please try again.")
    return false
  }
}

// Download the current resume as PDF
function downloadResumePdf() {
  const resumeEditor = document.getElementById("resumeEditor")

  if (!resumeEditor) {
    alert("Resume editor not found.")
    return
  }

  const resumeContent = resumeEditor.tagName === "TEXTAREA" ? resumeEditor.value : resumeEditor.textContent

  if (!resumeContent.trim()) {
    alert("Please add content to your resume before downloading.")
    return
  }

  // Generate PDF
  generateResumePdf(resumeContent)
}

// Add download button if jsPDF is available
document.addEventListener("DOMContentLoaded", () => {
  if (hasPdfLibrary) {
    const buttonContainer = document.querySelector(".button-container")

    if (buttonContainer) {
      const downloadButton = document.createElement("button")
      downloadButton.id = "downloadPdfBtn"
      downloadButton.className = "secondary-button"
      downloadButton.textContent = "Download PDF"
      downloadButton.addEventListener("click", downloadResumePdf)

      buttonContainer.appendChild(downloadButton)
    }
  }
})

// Make functions available globally
window.generateResumePdf = generateResumePdf
window.downloadResumePdf = downloadResumePdf
