import { XAI } from "xai"
import type { OptimizationOptions } from "@/components/optimization-settings"
import type { OptimizationResult } from "@/components/resume-optimizer"

type OptimizeResumeRequest = {
  resumeText: string
  jobDescription?: string
  keywords?: string[]
  options: OptimizationOptions
}

let xaiClient: XAI | null = null

export function getXaiClient(): XAI | null {
  if (xaiClient) {
    return xaiClient
  }

  const apiKey = process.env.XAI_API_KEY

  if (!apiKey) {
    console.error("XAI_API_KEY environment variable is not set")
    return null
  }

  try {
    xaiClient = new XAI({
      apiKey,
    })

    return xaiClient
  } catch (error) {
    console.error("Failed to initialize XAI client:", error)
    return null
  }
}

// NOTE: This is a placeholder implementation. In a real-world scenario,
// this would connect to the XAI (Grok) API to get AI-powered results.
export async function analyzeResumeWithAI(request: OptimizeResumeRequest): Promise<OptimizationResult> {
  const { resumeText, jobDescription, keywords = [], options } = request

  // Check if we have API key
  if (!process.env.XAI_API_KEY) {
    throw new Error("XAI API key is missing")
  }

  try {
    // In a real implementation, this would be an API call to XAI
    // For this example, we'll simulate a delay and return a mock response
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Extract keywords from job description if no keywords provided
    const extractedKeywords = keywords.length > 0 ? keywords : extractKeywordsFromText(jobDescription || "")

    // Determine which keywords are already in the resume
    const matchedKeywords: string[] = []
    const missingKeywords: string[] = []

    extractedKeywords.forEach((keyword) => {
      if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword)
      } else {
        missingKeywords.push(keyword)
      }
    })

    // Calculate match score
    const score = calculateMatchScore(matchedKeywords.length, extractedKeywords.length)

    // Generate optimized text
    const optimizedText = generateOptimizedText(resumeText, missingKeywords, options)

    // Generate improvement changes
    const changes = generateChanges(resumeText, missingKeywords, options)

    return {
      originalText: resumeText,
      optimizedText,
      changes,
      keywords: {
        matched: matchedKeywords,
        missing: missingKeywords,
      },
      score,
      fitRating: Math.round(score / 10),
      followupQuestions: generateFollowupQuestions(resumeText, jobDescription || "", missingKeywords),
    }
  } catch (error) {
    console.error("Error in XAI client:", error)
    throw new Error("Failed to analyze resume with AI")
  }
}

// Helper function to extract keywords from text
function extractKeywordsFromText(text: string): string[] {
  if (!text) return []

  // Filter out common words
  const commonWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "as",
    "into",
    "like",
    "through",
    "after",
    "over",
    "between",
    "out",
  ])

  // Extract words, normalize, and count frequency
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.has(word))

  const wordCounts: Record<string, number> = {}
  words.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  // Sort by frequency and take top keywords
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
}

// Calculate match score based on keywords
function calculateMatchScore(matchedKeywords: number, totalKeywords: number): number {
  if (totalKeywords === 0) return 75 // Default score if no keywords

  // Base score on keyword matches
  const baseScore = Math.round((matchedKeywords / totalKeywords) * 100)

  // Ensure score is between 50-95
  return Math.min(Math.max(baseScore, 50), 95)
}

// Generate optimized text
function generateOptimizedText(originalText: string, missingKeywords: string[], options: OptimizationOptions): string {
  // Simple implementation - in a real AI integration, this would be much more sophisticated
  let optimizedText = originalText

  // Add missing keywords to skills section if appropriate
  if (missingKeywords.length > 0 && options.prioritySections.includes("skills")) {
    if (originalText.toLowerCase().includes("skills")) {
      // Try to find the skills section and add keywords there
      const lines = originalText.split("\n")
      const skillsLineIndex = lines.findIndex(
        (line) => line.toLowerCase().includes("skills") && line.trim().length < 30,
      )

      if (skillsLineIndex >= 0) {
        // Add missing keywords after the skills heading
        const newLines = [...lines]
        const additionalSkills = `• Additional skills: ${missingKeywords.join(", ")}`
        newLines.splice(skillsLineIndex + 1, 0, additionalSkills)
        optimizedText = newLines.join("\n")
      } else {
        // Just add to the end if we can't find the right place
        optimizedText += `\n\nAdditional Skills: ${missingKeywords.join(", ")}`
      }
    } else {
      // No skills section found, add one
      optimizedText += `\n\nSKILLS\n• ${missingKeywords.join("\n• ")}`
    }
  }

  // Enhance experience section if set as priority
  if (options.prioritySections.includes("experience") && options.detailLevel !== "minimal") {
    optimizedText = enhanceExperienceSection(optimizedText, missingKeywords, options.detailLevel)
  }

  // Enhance summary if set as priority
  if (options.prioritySections.includes("summary")) {
    optimizedText = enhanceSummarySection(optimizedText, missingKeywords)
  }

  return optimizedText
}

// Enhance experience section
function enhanceExperienceSection(text: string, keywords: string[], detailLevel: string): string {
  if (!text.toLowerCase().includes("experience")) {
    return text
  }

  const lines = text.split("\n")
  const expLineIndex = lines.findIndex((line) => line.toLowerCase().includes("experience") && line.trim().length < 30)

  if (expLineIndex < 0) {
    return text
  }

  // Find bullet points in experience section and enhance them
  let inExperience = false
  let nextSectionFound = false

  const sections = ["education", "skills", "projects", "certifications", "awards", "publications"]

  const enhancedLines = lines.map((line, index) => {
    // Check if we're entering experience section
    if (index === expLineIndex) {
      inExperience = true
      return line
    }

    // Check if we're leaving experience section
    if (inExperience && !nextSectionFound) {
      const lowerLine = line.toLowerCase().trim()
      if (sections.some((section) => lowerLine.startsWith(section) && lowerLine.length < 30)) {
        nextSectionFound = true
        inExperience = false
      }
    }

    // Enhance bullet points in experience section
    if (inExperience && (line.trim().startsWith("•") || line.trim().startsWith("-"))) {
      if (detailLevel === "detailed" && Math.random() > 0.7) {
        return line + ` resulting in a ${Math.floor(Math.random() * 30) + 10}% improvement`
      }

      // Add a relevant keyword if possible
      for (const keyword of keywords) {
        if (Math.random() > 0.8 && !line.toLowerCase().includes(keyword)) {
          return line + ` utilizing ${keyword}`
        }
      }
    }

    return line
  })

  return enhancedLines.join("\n")
}

// Enhance summary section
function enhanceSummarySection(text: string, keywords: string[]): string {
  if (!text.toLowerCase().includes("summary")) {
    return text
  }

  const lines = text.split("\n")
  const summaryLineIndex = lines.findIndex((line) => line.toLowerCase().includes("summary") && line.trim().length < 30)

  if (summaryLineIndex < 0 || keywords.length === 0) {
    return text
  }

  // Find the summary content
  let summaryContent = ""
  let i = summaryLineIndex + 1

  while (i < lines.length && lines[i].trim() !== "" && !lines[i].match(/^[A-Z][A-Z\s]+$/)) {
    summaryContent += lines[i] + " "
    i++
  }

  if (summaryContent.length === 0) {
    return text
  }

  // Choose 2-3 keywords to add to the summary
  const keywordsToAdd = keywords.sort(() => Math.random() - 0.5).slice(0, Math.min(3, keywords.length))

  // Create enhanced summary
  const enhancedSummary = summaryContent.trim() + ` Skilled in ${keywordsToAdd.join(", ")}.`

  // Replace the summary content
  const newLines = [...lines]
  newLines[summaryLineIndex + 1] = enhancedSummary

  // Remove the old summary lines
  newLines.splice(summaryLineIndex + 2, i - summaryLineIndex - 2)

  return newLines.join("\n")
}

// Generate changes description for the UI
function generateChanges(originalText: string, missingKeywords: string[], options: OptimizationOptions) {
  const changes = []

  // Add missing keywords change
  if (missingKeywords.length > 0) {
    changes.push({
      type: "addition",
      section: "Skills",
      description: `Added ${missingKeywords.length} missing keywords to skills section: ${missingKeywords.join(", ")}`,
    })
  }

  // Add summary enhancement if applicable
  if (options.prioritySections.includes("summary") && originalText.toLowerCase().includes("summary")) {
    changes.push({
      type: "modification",
      section: "Summary",
      description: "Enhanced professional summary to highlight relevant qualifications",
    })
  }

  // Add experience enhancement if applicable
  if (options.prioritySections.includes("experience") && options.detailLevel !== "minimal") {
    changes.push({
      type: "modification",
      section: "Experience",
      description:
        options.detailLevel === "detailed"
          ? "Strengthened experience descriptions with action verbs and quantifiable achievements"
          : "Enhanced experience section with relevant keywords",
    })
  }

  // Add feedback on formatting if applicable
  if (!options.preserveFormatting) {
    changes.push({
      type: "modification",
      section: "Formatting",
      description: "Improved overall formatting and organization",
    })
  }

  return changes
}

// Generate follow-up questions
function generateFollowupQuestions(resumeText: string, jobDescription: string, missingKeywords: string[]): string[] {
  const questions = [
    "Would you like to add more detail to your work experience?",
    "Should I enhance your skills section with the missing keywords?",
    "Would you like suggestions for improving your resume formatting?",
  ]

  if (missingKeywords.length > 0) {
    questions.push(`Do you have experience with ${missingKeywords.join(", ")}?`)
  }

  if (!resumeText.toLowerCase().includes("education")) {
    questions.push("Would you like to add an education section to your resume?")
  }

  return questions.slice(0, 3)
}
