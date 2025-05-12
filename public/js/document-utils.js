/**
 * Document Utilities for Resume Optimizer
 * Handles DOC and DOCX file parsing
 */

/**
 * Extracts text from a DOCX file
 * @param {File} file - The DOCX file
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromDOCX(file) {
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Use Mammoth.js to extract text
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  } catch (error) {
    console.error("Error extracting text from DOCX:", error)
    throw new Error("Failed to extract text from DOCX. Please try another file.")
  }
}

/**
 * Extracts text from a DOC file
 * @param {File} file - The DOC file
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromDOC(file) {
  // Note: Parsing DOC files in the browser is challenging
  // This is a simplified approach that may not work for all DOC files
  try {
    // For DOC files, we'll show a message about limited support
    alert("DOC file support is limited. For best results, please use PDF or DOCX format.")

    // Try to read as text (this will only work for some DOC files)
    const text = await file.text()

    // Clean up the text by removing non-printable characters
    const cleanedText = text
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (cleanedText.length < 100) {
      throw new Error("Could not properly extract text from this DOC file.")
    }

    return cleanedText
  } catch (error) {
    console.error("Error extracting text from DOC:", error)
    throw new Error("Failed to extract text from DOC. Please convert to PDF or DOCX and try again.")
  }
}

/**
 * Extracts text from a resume file based on its type
 * @param {File} file - The resume file
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromFile(file) {
  const fileType = file.name.split(".").pop().toLowerCase()

  switch (fileType) {
    case "pdf":
      return await window.extractTextFromPDF(file)
    case "docx":
      return await extractTextFromDOCX(file)
    case "doc":
      return await extractTextFromDOC(file)
    default:
      throw new Error("Unsupported file type. Please upload a PDF, DOC, or DOCX file.")
  }
}

// Export functions to global scope
window.extractTextFromDOCX = extractTextFromDOCX
window.extractTextFromDOC = extractTextFromDOC
window.extractTextFromFile = extractTextFromFile

// Declare mammoth variable (assuming it's available globally or loaded via a script tag)
// If it's a module, you'd need to import it properly using import statements
// For example: import * as mammoth from 'mammoth';
// But for this case, we assume it's globally available.
const mammoth = window.mammoth
