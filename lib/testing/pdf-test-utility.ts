/**
 * PDF Testing Utility
 * Tools for testing PDF parsing with different PDF types and formats
 */

import { extractTextFromPDF } from "../parsers/robust-pdf-parser"
import { generatePDFDiagnosticsReport } from "../diagnostics/pdf-diagnostics"
import { generateParsingReport } from "../diagnostics/parsing-logger"

/**
 * Test PDF parsing with a specific file
 */
export async function testPDFParsing(file: File): Promise<{
  success: boolean
  extractedText: string
  textLength: number
  diagnostics: string
  parsingReport: string
  processingTime: number
}> {
  console.log(`Testing PDF parsing for: ${file.name}`)

  const startTime = performance.now()
  let success = false
  let extractedText = ""

  try {
    // Run the extraction
    extractedText = await extractTextFromPDF(file)

    // Check if we got meaningful text
    success = extractedText.length > 100

    console.log(`Extraction ${success ? "successful" : "failed"}, got ${extractedText.length} characters`)
  } catch (error) {
    console.error("Error during test:", error)
    success = false
  }

  const endTime = performance.now()
  const processingTime = endTime - startTime

  // Generate diagnostics
  const diagnostics = await generatePDFDiagnosticsReport(file)
  const parsingReport = generateParsingReport()

  return {
    success,
    extractedText,
    textLength: extractedText.length,
    diagnostics,
    parsingReport,
    processingTime,
  }
}

/**
 * Analyze extracted text quality
 */
export function analyzeExtractedText(text: string): {
  quality: "good" | "medium" | "poor"
  wordCount: number
  lineCount: number
  sectionCount: number
  detectedSections: string[]
} {
  if (!text || text.length < 100) {
    return {
      quality: "poor",
      wordCount: 0,
      lineCount: 0,
      sectionCount: 0,
      detectedSections: [],
    }
  }

  // Count words
  const words = text.split(/\s+/).filter((word) => word.length > 0)
  const wordCount = words.length

  // Count lines
  const lines = text.split("\n").filter((line) => line.trim().length > 0)
  const lineCount = lines.length

  // Detect resume sections
  const sectionPatterns = [
    { name: "Contact Information", regex: /(?:email|phone|address|linkedin)/i },
    { name: "Summary/Objective", regex: /(?:summary|objective|profile|about me)/i },
    { name: "Experience", regex: /(?:experience|employment|work history|professional background)/i },
    { name: "Education", regex: /(?:education|academic|degree|university|college)/i },
    { name: "Skills", regex: /(?:skills|expertise|proficiencies|competencies)/i },
    { name: "Projects", regex: /(?:projects|portfolio|works)/i },
    { name: "Certifications", regex: /(?:certifications|certificates|licenses)/i },
    { name: "Languages", regex: /(?:languages|language proficiency)/i },
  ]

  const detectedSections: string[] = []

  for (const section of sectionPatterns) {
    if (section.regex.test(text)) {
      detectedSections.push(section.name)
    }
  }

  // Determine quality
  let quality: "good" | "medium" | "poor" = "poor"

  if (wordCount > 200 && lineCount > 10 && detectedSections.length >= 3) {
    quality = "good"
  } else if (wordCount > 50 && lineCount > 5 && detectedSections.length >= 1) {
    quality = "medium"
  }

  return {
    quality,
    wordCount,
    lineCount,
    sectionCount: detectedSections.length,
    detectedSections,
  }
}
