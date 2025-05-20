/**
 * Resume Optimizer Testing Utility
 *
 * This module provides comprehensive testing utilities for the resume optimization flow,
 * including file parsing, content validation, and optimization testing.
 */

import { extractTextFromFile, isValidResumeContent } from "../file-utils"
import { analyzeResumeWithAI } from "../ai-analysis"
import { getRecentParsingEvents, clearParsingEvents } from "../parsers/parser-events"
import type { OptimizationOptions } from "@/components/optimization-settings"

// Test result interface
export interface TestResult {
  success: boolean
  component: string
  testName: string
  message: string
  details?: any
  error?: Error
}

// Test file metadata
export interface TestFile {
  name: string
  type: string
  size: number
  format: "pdf" | "docx" | "txt"
  expectedResult: "success" | "failure"
  description: string
}

// Test suite results
export interface TestSuiteResults {
  totalTests: number
  passedTests: number
  failedTests: number
  results: TestResult[]
  duration: number
}

/**
 * Run a comprehensive test suite on the resume optimization flow
 */
export async function runResumeOptimizerTests(files: File[]): Promise<TestSuiteResults> {
  const startTime = Date.now()
  const results: TestResult[] = []

  // Clear parsing events before starting tests
  clearParsingEvents()

  console.log("Starting Resume Optimizer Test Suite...")

  // Test file parsing
  for (const file of files) {
    try {
      await testFileParsing(file, results)
    } catch (error) {
      results.push({
        success: false,
        component: "FileParsing",
        testName: `Parse ${file.name}`,
        message: "Unexpected error during file parsing test",
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  // Test content validation
  await testContentValidation(results)

  // Test optimization with sample data
  await testOptimization(results)

  // Test error handling
  await testErrorHandling(results)

  // Calculate test statistics
  const totalTests = results.length
  const passedTests = results.filter((r) => r.success).length
  const failedTests = totalTests - passedTests
  const duration = Date.now() - startTime

  return {
    totalTests,
    passedTests,
    failedTests,
    results,
    duration,
  }
}

/**
 * Test file parsing functionality
 */
async function testFileParsing(file: File, results: TestResult[]): Promise<void> {
  console.log(`Testing file parsing for: ${file.name}`)

  try {
    // Test file extraction
    const startTime = Date.now()
    const extractedText = await extractTextFromFile(file)
    const duration = Date.now() - startTime

    // Validate extraction results
    if (!extractedText) {
      results.push({
        success: false,
        component: "FileParsing",
        testName: `Extract text from ${file.name}`,
        message: "Failed to extract text from file",
        details: { fileName: file.name, fileType: file.type, fileSize: file.size },
      })
      return
    }

    // Check if text is not too short
    if (extractedText.length < 100) {
      results.push({
        success: false,
        component: "FileParsing",
        testName: `Extract text from ${file.name}`,
        message: "Extracted text is too short",
        details: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          textLength: extractedText.length,
          textPreview: extractedText.substring(0, 100),
        },
      })
      return
    }

    // Check for garbled text
    const unusualCharCount = (extractedText.match(/[^\x20-\x7E\n\r\t]/g) || []).length
    const unusualCharPercentage = (unusualCharCount / extractedText.length) * 100

    if (unusualCharPercentage > 15) {
      results.push({
        success: false,
        component: "FileParsing",
        testName: `Extract text from ${file.name}`,
        message: "Extracted text contains too many unusual characters",
        details: {
          fileName: file.name,
          fileType: file.type,
          unusualCharPercentage: `${unusualCharPercentage.toFixed(2)}%`,
          textPreview: extractedText.substring(0, 100),
        },
      })
      return
    }

    // Get parsing events for this file
    const parsingEvents = getRecentParsingEvents().filter((event) => event.fileName === file.name)

    // Success case
    results.push({
      success: true,
      component: "FileParsing",
      testName: `Extract text from ${file.name}`,
      message: `Successfully extracted ${extractedText.length} characters in ${duration}ms`,
      details: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        textLength: extractedText.length,
        parsingEvents,
        processingTime: `${duration}ms`,
        textPreview: extractedText.substring(0, 100) + "...",
      },
    })

    // Test content validation
    const fileType = file.name.split(".").pop()?.toLowerCase()
    const isValid = isValidResumeContent(extractedText, fileType)

    results.push({
      success: isValid,
      component: "ContentValidation",
      testName: `Validate content from ${file.name}`,
      message: isValid
        ? "Content validation passed"
        : "Content validation failed - text does not appear to be a valid resume",
      details: {
        fileName: file.name,
        fileType: file.type,
        textLength: extractedText.length,
      },
    })
  } catch (error) {
    results.push({
      success: false,
      component: "FileParsing",
      testName: `Extract text from ${file.name}`,
      message: "Error during text extraction",
      error: error instanceof Error ? error : new Error(String(error)),
      details: { fileName: file.name, fileType: file.type, fileSize: file.size },
    })
  }
}

/**
 * Test content validation functionality
 */
async function testContentValidation(results: TestResult[]): Promise<void> {
  console.log("Testing content validation...")

  // Test with valid resume content
  const validResumeContent = `
John Doe
123 Main St, Anytown, USA
john.doe@example.com | (555) 123-4567

SUMMARY
Experienced software engineer with 5+ years in web development.

EXPERIENCE
Senior Developer, ABC Company, 2020-Present
- Led development of enterprise web applications
- Managed team of 5 junior developers

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2016
  `

  const isValidResume = isValidResumeContent(validResumeContent, "txt")
  results.push({
    success: isValidResume,
    component: "ContentValidation",
    testName: "Validate valid resume content",
    message: isValidResume ? "Valid resume content correctly identified" : "Failed to identify valid resume content",
    details: { contentLength: validResumeContent.length },
  })

  // Test with invalid content
  const invalidContent = "This is not a resume. Just some random text that doesn't look like a resume at all."
  const isInvalidContentRejected = !isValidResumeContent(invalidContent, "txt")
  results.push({
    success: isInvalidContentRejected,
    component: "ContentValidation",
    testName: "Reject invalid content",
    message: isInvalidContentRejected ? "Invalid content correctly rejected" : "Failed to reject invalid content",
    details: { contentLength: invalidContent.length },
  })

  // Test with empty content
  const isEmptyContentRejected = !isValidResumeContent("", "txt")
  results.push({
    success: isEmptyContentRejected,
    component: "ContentValidation",
    testName: "Reject empty content",
    message: isEmptyContentRejected ? "Empty content correctly rejected" : "Failed to reject empty content",
  })

  // Test with garbled content
  const garbledContent = "PK\u0003\u0004\u0014\u0000\u0006\u0000\b\u0000\u0000\u0000!\u0000���\u001a\u0000\u0000\u0000"
  const isGarbledContentRejected = !isValidResumeContent(garbledContent, "docx")
  results.push({
    success: isGarbledContentRejected,
    component: "ContentValidation",
    testName: "Reject garbled content",
    message: isGarbledContentRejected ? "Garbled content correctly rejected" : "Failed to reject garbled content",
    details: { contentLength: garbledContent.length },
  })
}

/**
 * Test optimization functionality
 */
async function testOptimization(results: TestResult[]): Promise<void> {
  console.log("Testing optimization functionality...")

  const sampleResume = `
John Doe
123 Main St, Anytown, USA
john.doe@example.com | (555) 123-4567

SUMMARY
Experienced software engineer with 5+ years in web development.

EXPERIENCE
Senior Developer, ABC Company, 2020-Present
- Led development of enterprise web applications
- Managed team of 5 junior developers

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2016
  `

  const sampleJobDescription = `
We are looking for a Senior Software Engineer with experience in React, Node.js, and cloud technologies.
The ideal candidate will have strong problem-solving skills and experience leading development teams.
Requirements:
- 5+ years of experience in web development
- Proficiency in JavaScript, React, and Node.js
- Experience with AWS or other cloud platforms
- Team leadership experience
  `

  const options: OptimizationOptions = {
    detailLevel: "moderate",
    prioritySections: ["experience", "skills", "education"],
    preserveFormatting: true,
    keywordDensity: "medium",
  }

  try {
    // Test optimization with valid inputs
    const optimizationResult = await analyzeResumeWithAI({
      resumeText: sampleResume,
      jobDescription: sampleJobDescription,
      options,
    })

    // Validate optimization results
    const hasOptimizedText = optimizationResult.optimizedText && optimizationResult.optimizedText.length > 0

    const hasKeywords =
      optimizationResult.keywords &&
      (optimizationResult.keywords.matched.length > 0 || optimizationResult.keywords.missing.length > 0)

    const hasScore =
      typeof optimizationResult.score === "number" && optimizationResult.score >= 0 && optimizationResult.score <= 100

    const hasChanges = Array.isArray(optimizationResult.changes) && optimizationResult.changes.length > 0

    results.push({
      success: hasOptimizedText && hasKeywords && hasScore,
      component: "Optimization",
      testName: "Optimize resume with job description",
      message:
        hasOptimizedText && hasKeywords && hasScore
          ? "Successfully optimized resume"
          : "Failed to properly optimize resume",
      details: {
        originalLength: sampleResume.length,
        optimizedLength: optimizationResult.optimizedText.length,
        score: optimizationResult.score,
        matchedKeywords: optimizationResult.keywords.matched.length,
        missingKeywords: optimizationResult.keywords.missing.length,
        changes: optimizationResult.changes.length,
      },
    })

    // Test specific optimization aspects
    results.push({
      success: hasOptimizedText,
      component: "Optimization",
      testName: "Generate optimized text",
      message: hasOptimizedText ? "Successfully generated optimized text" : "Failed to generate optimized text",
    })

    results.push({
      success: hasKeywords,
      component: "Optimization",
      testName: "Extract keywords",
      message: hasKeywords ? "Successfully extracted keywords" : "Failed to extract keywords",
    })

    results.push({
      success: hasScore,
      component: "Optimization",
      testName: "Calculate optimization score",
      message: hasScore
        ? `Successfully calculated score: ${optimizationResult.score}`
        : "Failed to calculate valid score",
    })

    results.push({
      success: hasChanges,
      component: "Optimization",
      testName: "Generate suggested changes",
      message: hasChanges
        ? `Successfully generated ${optimizationResult.changes.length} changes`
        : "Failed to generate changes",
    })
  } catch (error) {
    results.push({
      success: false,
      component: "Optimization",
      testName: "Optimize resume",
      message: "Error during optimization",
      error: error instanceof Error ? error : new Error(String(error)),
    })
  }
}

/**
 * Test error handling functionality
 */
async function testErrorHandling(results: TestResult[]): Promise<void> {
  console.log("Testing error handling...")

  // Test with empty resume
  try {
    await analyzeResumeWithAI({
      resumeText: "",
      jobDescription: "Sample job description",
      options: {
        detailLevel: "moderate",
        prioritySections: ["experience", "skills", "education"],
        preserveFormatting: true,
        keywordDensity: "medium",
      },
    })

    // If we get here, the function didn't throw an error for empty resume
    results.push({
      success: false,
      component: "ErrorHandling",
      testName: "Handle empty resume",
      message: "Failed to handle empty resume properly - should have thrown an error",
    })
  } catch (error) {
    // Expected behavior - should throw an error
    results.push({
      success: true,
      component: "ErrorHandling",
      testName: "Handle empty resume",
      message: "Correctly handled empty resume by throwing an error",
      details: { error: error instanceof Error ? error.message : String(error) },
    })
  }

  // Test with empty job description and no keywords
  try {
    await analyzeResumeWithAI({
      resumeText: "Sample resume text",
      jobDescription: "",
      keywords: [],
      options: {
        detailLevel: "moderate",
        prioritySections: ["experience", "skills", "education"],
        preserveFormatting: true,
        keywordDensity: "medium",
      },
    })

    // If we get here, the function didn't throw an error for empty job description
    results.push({
      success: false,
      component: "ErrorHandling",
      testName: "Handle empty job description and keywords",
      message: "Failed to handle empty job description and keywords properly",
    })
  } catch (error) {
    // Expected behavior - should throw an error
    results.push({
      success: true,
      component: "ErrorHandling",
      testName: "Handle empty job description and keywords",
      message: "Correctly handled empty job description and keywords",
      details: { error: error instanceof Error ? error.message : String(error) },
    })
  }
}

/**
 * Generate a test report in HTML format
 */
export function generateTestReport(results: TestSuiteResults): string {
  const passRate = (results.passedTests / results.totalTests) * 100

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume Optimizer Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { margin-top: 0; }
    .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .pass-rate { font-size: 24px; font-weight: bold; }
    .pass { color: #2e7d32; }
    .fail { color: #c62828; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; }
    tr.success { background-color: #e8f5e9; }
    tr.failure { background-color: #ffebee; }
    .details { font-family: monospace; white-space: pre-wrap; background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
    .component-group { margin-bottom: 30px; }
  </style>
</head>
<body>
  <h1>Resume Optimizer Test Report</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Tests: ${results.totalTests}</p>
    <p>Passed: ${results.passedTests}</p>
    <p>Failed: ${results.failedTests}</p>
    <p>Duration: ${(results.duration / 1000).toFixed(2)}s</p>
    <p class="pass-rate ${passRate >= 90 ? "pass" : "fail"}">Pass Rate: ${passRate.toFixed(2)}%</p>
  </div>
  
  ${generateComponentTables(results.results)}
  
</body>
</html>
  `
}

/**
 * Generate component-specific result tables
 */
function generateComponentTables(results: TestResult[]): string {
  // Group results by component
  const componentGroups: Record<string, TestResult[]> = {}

  results.forEach((result) => {
    if (!componentGroups[result.component]) {
      componentGroups[result.component] = []
    }
    componentGroups[result.component].push(result)
  })

  // Generate tables for each component
  return Object.entries(componentGroups)
    .map(([component, componentResults]) => {
      const passedTests = componentResults.filter((r) => r.success).length
      const totalTests = componentResults.length
      const passRate = (passedTests / totalTests) * 100

      return `
    <div class="component-group">
      <h2>${component} (${passedTests}/${totalTests}, ${passRate.toFixed(2)}%)</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Test</th>
            <th>Message</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${componentResults
            .map(
              (result) => `
            <tr class="${result.success ? "success" : "failure"}">
              <td>${result.success ? "✅ PASS" : "❌ FAIL"}</td>
              <td>${result.testName}</td>
              <td>${result.message}</td>
              <td>
                ${result.error ? `<div class="details">Error: ${result.error.message}</div>` : ""}
                ${result.details ? `<div class="details">${JSON.stringify(result.details, null, 2)}</div>` : ""}
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
    })
    .join("")
}
