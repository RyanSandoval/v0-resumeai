/**
 * Document Utilities for Resume Optimizer
 */

/**
 * Extracts text from a file based on its type
 * @param {File} file - The file to extract text from
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromFile(file) {
  const fileType = file.name.split(".").pop().toLowerCase()

  switch (fileType) {
    case "pdf":
      return await extractTextFromPDF(file)
    case "docx":
      return await extractTextFromDOCX(file)
    case "doc":
      return await extractTextFromDOC(file)
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

/**
 * Extracts text from a DOCX file
 * @param {File} file - The DOCX file
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromDOCX(file) {
  try {
    // Check if mammoth is available
    if (typeof mammoth === "undefined") {
      throw new Error("DOCX parsing library not loaded. Please refresh the page and try again.")
    }

    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Use mammoth to extract text
    const result = await mammoth.extractRawText({ arrayBuffer })

    return result.value
  } catch (error) {
    console.error("Error extracting text from DOCX:", error)
    throw new Error("Failed to extract text from DOCX file. Please try another file.")
  }
}

/**
 * Extracts text from a DOC file
 * @param {File} file - The DOC file
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromDOC(file) {
  // DOC files are more difficult to parse in the browser
  // This is a simplified implementation with a warning

  alert("Note: DOC file support is limited. For best results, please use PDF or DOCX format.")

  try {
    // Read the file as text (this won't work well for DOC files but might extract some content)
    const text = await file.text()

    // Try to clean up the text by removing non-printable characters
    const cleanedText = text
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (cleanedText.length < 100) {
      throw new Error("Could not properly extract text from DOC file. Please convert to PDF or DOCX and try again.")
    }

    return cleanedText
  } catch (error) {
    console.error("Error extracting text from DOC:", error)
    throw new Error("Failed to extract text from DOC file. Please convert to PDF or DOCX and try again.")
  }
}

// Dummy declarations to satisfy the linter.  These should be loaded by the page.
const mammoth = window.mammoth
const extractTextFromPDF = window.extractTextFromPDF

// Export functions to global scope
window.extractTextFromFile = extractTextFromFile
window.extractTextFromDOCX = extractTextFromDOCX
window.extractTextFromDOC = extractTextFromDOC
