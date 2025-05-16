/**
 * Document Utilities for Resume Optimizer
 * Handles different document formats
 */

;(() => {
  /**
   * Extracts text from a file based on its type
   * @param {File} file - The file to extract text from
   * @returns {Promise<string>} - The extracted text
   */
  async function extractTextFromFile(file) {
    if (!file) {
      throw new Error("No file provided")
    }

    const fileExtension = file.name.split(".").pop().toLowerCase()

    switch (fileExtension) {
      case "pdf":
        return extractTextFromPDF(file)
      case "doc":
      case "docx":
        return extractTextFromDOCX(file)
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  }

  /**
   * Extracts text from a DOCX file
   * @param {File} file - The DOCX file
   * @returns {Promise<string>} - The extracted text
   */
  async function extractTextFromDOCX(file) {
    try {
      // Check if mammoth.js is loaded
      if (typeof mammoth === "undefined") {
        throw new Error("Mammoth.js library not loaded. Please refresh the page and try again.")
      }

      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Extract text using mammoth.js
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } catch (error) {
      console.error("Error extracting text from DOCX:", error)
      throw new Error("Failed to extract text from DOCX. Please try another file.")
    }
  }

  // Expose functions to global scope
  window.extractTextFromFile = extractTextFromFile
  window.extractTextFromDOCX = extractTextFromDOCX

  // Dummy functions to avoid errors. These should be implemented elsewhere.
  async function extractTextFromPDF(file) {
    console.warn("extractTextFromPDF function is a placeholder. Implement the actual PDF extraction logic.")
    return Promise.resolve("")
  }
})()
