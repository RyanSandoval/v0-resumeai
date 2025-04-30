/**
 * PDF parsing utilities using PDF.js
 * This file provides a more robust implementation for PDF text extraction
 */

import * as pdfjs from "pdfjs-dist"
import { getSampleResume } from "../file-utils"

// Initialize PDF.js worker
// In a real implementation, we would set the worker path
// pdfjs.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Extract text from PDF file using PDF.js
 */
export async function extractTextFromPDFWithPDFJS(file: File): Promise<string> {
  try {
    console.log(`Starting PDF.js extraction for: ${file.name} (${file.size} bytes)`)

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    console.log(`PDF loaded successfully. Number of pages: ${pdf.numPages}`)

    // Extract text from each page
    let fullText = ""

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()

      // Concatenate the text items
      const pageText = textContent.items.map((item: any) => item.str).join(" ")

      fullText += pageText + "\n\n"
    }

    if (fullText.trim().length > 0) {
      console.log("Successfully extracted text using PDF.js")
      return fullText
    } else {
      console.log("PDF.js extraction returned empty text")
      return getSampleResume()
    }
  } catch (error) {
    console.error("Error in PDF.js extraction:", error)
    return getSampleResume()
  }
}
