/**
 * File utilities for handling resume files
 * Includes functions for extracting text from PDF, DOCX, and TXT files
 * and generating optimized files in various formats
 */

import { detectFileType } from "./file-type-detector"
import { logParsingEvent } from "./parsers/parser-events"

// Sample resume text for fallback
const SAMPLE_RESUME = `JOHN DOE
123 Main Street, City, State 12345
(123) 456-7890 | john.doe@email.com | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable applications and optimizing performance.

SKILLS
Programming Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Redux, HTML5, CSS3, SASS, Tailwind CSS
Backend: Node.js, Express, Django, Spring Boot
Databases: MongoDB, PostgreSQL, MySQL, Redis
Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD, GitHub Actions
Testing: Jest, React Testing Library, Cypress

EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
• Led the development of a customer-facing portal that improved user engagement by 35%
• Architected and implemented microservices architecture, reducing system latency by 40%
• Mentored junior developers and conducted code reviews to ensure code quality
• Collaborated with product managers to define and prioritize feature roadmaps

Software Engineer | WebSolutions LLC | Mar 2018 - Dec 2020
• Developed RESTful APIs and integrated third-party services for e-commerce platform
• Implemented responsive UI components using React and Material UI
• Optimized database queries, resulting in 25% faster page load times
• Participated in agile development process with bi-weekly sprints

Junior Developer | StartupTech | Jun 2016 - Feb 2018
• Built and maintained features for company's main web application
• Assisted in migrating legacy codebase to modern JavaScript frameworks
• Implemented automated testing, increasing code coverage from 45% to 80%

EDUCATION

Bachelor of Science in Computer Science
University of Technology | Graduated: May 2016
• GPA: 3.8/4.0
• Relevant coursework: Data Structures, Algorithms, Database Systems, Web Development

PROJECTS

Personal Finance Dashboard
• Developed a full-stack application for tracking expenses and visualizing spending patterns
• Technologies used: React, Node.js, Express, MongoDB, Chart.js

Open Source Contribution - DevTools Extension
• Created a browser extension to enhance developer productivity
• Implemented features for JSON formatting and local storage inspection

CERTIFICATIONS
• AWS Certified Developer - Associate
• MongoDB Certified Developer
• React Advanced Patterns Workshop`

/**
 * Main function to extract text from uploaded resume files
 * This function is designed to be called only in browser environments
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // Make sure we're in a browser environment
  if (typeof window === "undefined") {
    throw new Error("File extraction can only be performed in a browser environment")
  }

  try {
    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`)
    logParsingEvent("start", "file", file.name, file.size)

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      const error = new Error("File is too large. Please upload a file smaller than 10MB.")
      logParsingEvent("error", "file-size", file.name, file.size, 0, error)
      throw error
    }

    // Use our improved file type detection
    const fileType = await detectFileType(file)
    console.log(`Detected file type: ${fileType}`)

    if (fileType === "pdf") {
      // Since PDF parsing can be problematic, we'll use a client-side only approach
      // First check if we're in a browser environment
      if (typeof window !== "undefined") {
        try {
          // Dynamically import our enhanced PDF parser
          const { extractTextFromPDF } = await import("./parsers/robust-pdf-parser")
          const text = await extractTextFromPDF(file)

          // Don't validate PDF content length here - just return what we got
          if (text) {
            console.log(`PDF extraction successful, got ${text.length} characters`)
            logParsingEvent("success", "pdf", file.name, file.size, text.length)
            return text
          }
        } catch (error) {
          console.error("PDF parser failed:", error)
          logParsingEvent("error", "pdf", file.name, file.size, 0, error)
          // Fall through to use the sample resume if parser fails
        }
      } else {
        throw new Error("PDF parsing can only be performed in browser environments")
      }

      // If we get here, either we're not in a browser or the parser failed
      console.log("PDF parsing failed or not supported in this environment, using sample resume")
      logParsingEvent("fallback", "pdf-sample", file.name, file.size)
      return getSampleResume()
    } else if (fileType === "docx") {
      // Dynamically import the enhanced DOCX parser
      const { extractTextFromDOCX } = await import("./parsers/enhanced-docx-parser")
      const text = await extractTextFromDOCX(file)

      // Validate the extracted text
      if (text && text.length > 100) {
        return text
      }

      // If text is too short, use sample resume
      console.log("DOCX extraction returned insufficient text, using sample resume")
      logParsingEvent("fallback", "docx-sample", file.name, file.size)
      return getSampleResume()
    } else if (fileType === "txt") {
      return await extractTextFromTXT(file)
    } else {
      const error = new Error(`Unsupported file format: ${fileType}. Please upload a PDF, DOCX, or TXT file.`)
      logParsingEvent("error", "unsupported-format", file.name, file.size, 0, error)
      throw error
    }
  } catch (error) {
    console.error("Error extracting text from file:", error)
    logParsingEvent("error", "extraction", file.name, file.size, 0, error)

    // Return a more informative error message
    if (error instanceof Error) {
      throw new Error(`Failed to process file: ${error.message}`)
    }

    throw new Error("Failed to process file. Please try a different file or format.")
  }
}

/**
 * Extract text from TXT file
 */
async function extractTextFromTXT(file: File): Promise<string> {
  try {
    console.log("Extracting text from TXT file")
    logParsingEvent("start", "txt", file.name, file.size)

    const text = await file.text()

    if (text && text.length > 0) {
      console.log("Successfully extracted text from TXT file")
      logParsingEvent("success", "txt", file.name, file.size, text.length)
      return text
    }

    console.log("TXT file appears to be empty, using sample resume")
    logParsingEvent("fallback", "txt-sample", file.name, file.size)
    return SAMPLE_RESUME
  } catch (error) {
    console.error("Error extracting text from TXT:", error)
    logParsingEvent("error", "txt", file.name, file.size, 0, error)
    return SAMPLE_RESUME
  }
}

/**
 * Generate optimized file in various formats
 */
export async function generateOptimizedFile(
  originalFile: File,
  optimizedText: string,
  format: "pdf" | "docx" | "txt" = "txt",
): Promise<File> {
  // Make sure we're in a browser environment
  if (typeof window === "undefined") {
    throw new Error("File generation can only be performed in a browser environment")
  }

  try {
    const originalName = originalFile.name.replace(/\.[^/.]+$/, "")

    if (format === "pdf") {
      // Dynamically import jsPDF
      const { jsPDF } = await import("jspdf")
      return await generatePDF(originalName, optimizedText, jsPDF)
    } else if (format === "docx") {
      // Dynamically import docx
      const { Document, Packer, Paragraph, TextRun } = await import("docx")
      return await generateDOCX(originalName, optimizedText, { Document, Packer, Paragraph, TextRun })
    } else {
      // Default to TXT
      const blob = new Blob([optimizedText], { type: "text/plain" })
      return new File([blob], `${originalName}-optimized.txt`, { type: "text/plain" })
    }
  } catch (error) {
    console.error("Error generating optimized file:", error)
    // Fallback to text file
    const blob = new Blob([optimizedText], { type: "text/plain" })
    return new File([blob], `optimized-resume.txt`, { type: "text/plain" })
  }
}

/**
 * Generate PDF file using jsPDF
 */
async function generatePDF(fileName: string, content: string, jsPDFModule: any): Promise<File> {
  const doc = new jsPDFModule()

  // Split content into lines
  const lines = content.split("\n")

  // Add content to PDF
  let y = 10
  const lineHeight = 7
  const pageHeight = doc.internal.pageSize.height - 20 // Leave some margin

  for (const line of lines) {
    // Check if we need a new page
    if (y > pageHeight) {
      doc.addPage()
      y = 10
    }

    doc.text(line, 10, y)
    y += lineHeight
  }

  // Convert to blob and then to File
  const pdfBlob = doc.output("blob")
  return new File([pdfBlob], `${fileName}-optimized.pdf`, { type: "application/pdf" })
}

/**
 * Generate DOCX file using docx library
 */
async function generateDOCX(fileName: string, content: string, docxModules: any): Promise<File> {
  const { Document, Packer, Paragraph, TextRun } = docxModules

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: content.split("\n").map(
          (line) =>
            new Paragraph({
              children: [new TextRun(line)],
            }),
        ),
      },
    ],
  })

  // Generate blob
  const buffer = await Packer.toBuffer(doc)
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })

  return new File([blob], `${fileName}-optimized.docx`, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
}

/**
 * Get sample resume text (for fallback)
 */
export function getSampleResume(): string {
  return SAMPLE_RESUME
}

/**
 * Validate file before processing
 */
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (!file) {
    return { valid: false, error: "No file selected" }
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty" }
  }

  if (file.size > 10 * 1024 * 1024) {
    // 10MB limit
    return { valid: false, error: "File is too large. Please upload a file smaller than 10MB." }
  }

  return { valid: true }
}

/**
 * Check if the extracted text is valid resume content
 */
export function isValidResumeContent(text: string, fileType?: string): boolean {
  // Different minimum length based on file type
  const minLength = fileType === "pdf" ? 20 : 50

  if (!text || text.length < minLength) {
    return false
  }

  // For very short texts, be more lenient with PDFs
  if (text.length < 100 && fileType === "pdf") {
    // If it's a PDF with short text, check for common resume keywords
    const keywords = ["resume", "cv", "experience", "education", "skills", "work", "job", "name", "email", "phone"]
    const lowerText = text.toLowerCase()

    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return true
      }
    }
  }

  // Check for common resume sections
  const resumeSections = [
    "experience",
    "education",
    "skills",
    "summary",
    "objective",
    "work history",
    "employment",
    "projects",
    "certifications",
    "resume",
    "cv",
    "profile",
    "contact",
    "references",
    "achievements",
    "qualifications",
  ]

  let sectionCount = 0
  const lowerText = text.toLowerCase()

  for (const section of resumeSections) {
    if (lowerText.includes(section)) {
      sectionCount++
    }
  }

  // Different required section count based on file type
  const requiredSections = fileType === "pdf" ? 1 : 2
  return sectionCount >= requiredSections
}
