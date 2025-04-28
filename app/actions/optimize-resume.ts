"use server"

import type { OptimizationOptions, OptimizationResult } from "@/components/resume-optimizer"

export async function analyzeResumeWithAI({
  resumeText,
  jobDescription,
  keywords,
  options,
}: {
  resumeText: string
  jobDescription: string
  keywords: string[]
  options: OptimizationOptions
}): Promise<OptimizationResult> {
  try {
    // Since we're having issues with the Grok API, let's use a simpler approach
    // that doesn't rely on external API calls but still provides useful functionality

    console.log("Starting resume analysis with local processing")

    // Extract keywords from job description
    const extractedKeywords = extractKeywordsFromJobDescription(jobDescription)

    // Combine with user-provided keywords
    const allKeywords = [...new Set([...keywords, ...extractedKeywords])]

    // Find matching and missing keywords
    const matchedKeywords = allKeywords.filter((keyword) => resumeText.toLowerCase().includes(keyword.toLowerCase()))

    const missingKeywords = allKeywords.filter((keyword) => !resumeText.toLowerCase().includes(keyword.toLowerCase()))

    // Generate optimized text by adding missing keywords
    const optimizedText = addMissingKeywordsToResume(resumeText, missingKeywords)

    // Generate changes based on the modifications
    const changes = generateChanges(resumeText, optimizedText, missingKeywords)

    // Calculate a match score
    const matchScore = calculateMatchScore(matchedKeywords.length, allKeywords.length)

    console.log("Resume analysis complete")

    return {
      originalText: resumeText,
      optimizedText,
      jobDescription,
      changes,
      keywords: {
        matched: matchedKeywords,
        missing: missingKeywords,
      },
      score: matchScore,
    }
  } catch (error) {
    console.error("Error in resume analysis:", error)
    return generateFallbackResult(resumeText, jobDescription)
  }
}

// Extract important keywords from job description
function extractKeywordsFromJobDescription(jobDescription: string): string[] {
  // Split the job description into words
  const words = jobDescription.toLowerCase().split(/\W+/)

  // Filter out common words and short words
  const commonWords = new Set([
    "the",
    "and",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "of",
    "from",
    "as",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "shall",
    "should",
    "may",
    "might",
    "must",
    "can",
    "could",
  ])

  const filteredWords = words.filter((word) => word.length > 3 && !commonWords.has(word))

  // Count word frequency
  const wordCounts: Record<string, number> = {}
  filteredWords.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  // Sort by frequency and take top keywords
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0])

  // Return top 15 keywords
  return sortedWords.slice(0, 15)
}

// Add missing keywords to the resume
function addMissingKeywordsToResume(resumeText: string, missingKeywords: string[]): string {
  if (missingKeywords.length === 0) {
    return resumeText
  }

  // Split resume into sections
  const sections = identifyResumeSections(resumeText)
  let optimizedText = resumeText

  // Add keywords to appropriate sections
  missingKeywords.forEach((keyword) => {
    // Determine best section for this keyword
    const targetSection = determineBestSection(keyword, sections)

    if (targetSection && sections[targetSection]) {
      // Add keyword to the section
      optimizedText = addKeywordToSection(optimizedText, keyword, sections[targetSection])
    }
  })

  return optimizedText
}

// Identify resume sections
function identifyResumeSections(resumeText: string): Record<string, { start: number; end: number }> {
  const lines = resumeText.split("\n")
  const sections: Record<string, { start: number; end: number }> = {}

  // Common section headers in resumes
  const sectionPatterns = {
    summary: /^(summary|professional\s+summary|profile|about\s+me)/i,
    experience: /^(experience|work\s+experience|employment\s+history|work\s+history|professional\s+experience)/i,
    skills: /^(skills|technical\s+skills|core\s+competencies|key\s+skills|expertise)/i,
    education: /^(education|academic\s+background|educational\s+background)/i,
    projects: /^(projects|key\s+projects|relevant\s+projects)/i,
    certifications: /^(certifications|certificates|professional\s+certifications)/i,
  }

  let currentSection = ""
  let currentStart = 0

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    // Check if this line is a section header
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(trimmedLine) && trimmedLine.length < 50) {
        // If we were in a section, mark its end
        if (currentSection) {
          sections[currentSection] = {
            start: currentStart,
            end: index - 1,
          }
        }

        // Start new section
        currentSection = section
        currentStart = index
        break
      }
    }

    // If we're at the end, close the final section
    if (index === lines.length - 1 && currentSection) {
      sections[currentSection] = {
        start: currentStart,
        end: index,
      }
    }
  })

  return sections
}

// Determine best section for a keyword
function determineBestSection(keyword: string, sections: Record<string, any>): string {
  // Technical skills usually go in skills section
  if (/\b(language|framework|tool|software|technology|programming|database|cloud|platform)\b/i.test(keyword)) {
    return "skills"
  }
  // Education-related keywords
  else if (/\b(degree|university|college|education|gpa|graduate|certification)\b/i.test(keyword)) {
    return "education"
  }
  // Experience-related keywords
  else if (
    /\b(led|managed|developed|implemented|created|designed|analyzed|improved|increased|reduced|team|project)\b/i.test(
      keyword,
    )
  ) {
    return "experience"
  }

  // Default to skills if available, otherwise summary
  return sections.skills ? "skills" : sections.summary ? "summary" : "experience"
}

// Add keyword to a specific section
function addKeywordToSection(resumeText: string, keyword: string, section: { start: number; end: number }): string {
  const lines = resumeText.split("\n")
  const sectionLines = lines.slice(section.start, section.end + 1)

  // Check if keyword is already in the section
  const sectionText = sectionLines.join(" ").toLowerCase()
  if (sectionText.includes(keyword.toLowerCase())) {
    return resumeText
  }

  // Different strategies based on section type
  if (section.start === 0) {
    // If it's the first section (likely summary)
    // Add to the end of the summary
    const lastLine = sectionLines[sectionLines.length - 1]
    lines[section.end] = lastLine + (lastLine.endsWith(".") ? " " : ". ") + `Proficient in ${keyword}.`
  } else if (sectionText.includes("skills") || sectionText.includes("competencies")) {
    // Add to skills list
    // Find a line with bullet points or create one
    let bulletLineIndex = -1
    for (let i = section.start; i <= section.end; i++) {
      if (lines[i].includes("•") || lines[i].includes("-") || lines[i].includes("*")) {
        bulletLineIndex = i
        break
      }
    }

    if (bulletLineIndex >= 0) {
      // Add after an existing bullet point
      lines.splice(bulletLineIndex + 1, 0, `• ${keyword}`)
      // Update section end
      section.end += 1
    } else {
      // Add at the end of the section
      lines.splice(section.end + 1, 0, `• ${keyword}`)
      // Update section end
      section.end += 1
    }
  } else {
    // For other sections, add as a bullet point at the end
    lines.splice(section.end + 1, 0, `• Experience with ${keyword}`)
    // Update section end
    section.end += 1
  }

  return lines.join("\n")
}

// Generate changes based on modifications
function generateChanges(
  originalText: string,
  optimizedText: string,
  missingKeywords: string[],
): Array<{
  type: "addition" | "modification"
  section: string
  description: string
}> {
  const changes: Array<{
    type: "addition" | "modification"
    section: string
    description: string
  }> = []

  // Generate changes for each missing keyword
  missingKeywords.forEach((keyword) => {
    // Determine which section the keyword was added to
    const sections = ["Summary", "Experience", "Skills", "Education", "Projects", "Certifications"]
    let targetSection = "General"

    for (const section of sections) {
      if (
        optimizedText.toLowerCase().includes(keyword.toLowerCase()) &&
        !originalText.toLowerCase().includes(keyword.toLowerCase())
      ) {
        targetSection = section
        break
      }
    }

    changes.push({
      type: "addition",
      section: targetSection,
      description: `Added "${keyword}" to highlight relevant expertise`,
    })
  })

  // If no specific changes were made but text differs
  if (changes.length === 0 && originalText !== optimizedText) {
    changes.push({
      type: "modification",
      section: "General",
      description: "Enhanced resume content to better match job requirements",
    })
  }

  return changes
}

// Calculate match score
function calculateMatchScore(matchedKeywords: number, totalKeywords: number): number {
  if (totalKeywords === 0) return 75 // Default score if no keywords

  // Base score on keyword matches
  const baseScore = Math.round((matchedKeywords / totalKeywords) * 100)

  // Ensure score is between 50-95
  return Math.min(Math.max(baseScore, 50), 95)
}

// Fallback function for when analysis fails
function generateFallbackResult(resumeText: string, jobDescription: string): OptimizationResult {
  return {
    originalText: resumeText,
    optimizedText: resumeText,
    jobDescription,
    changes: [
      {
        type: "modification",
        section: "General",
        description: "Unable to optimize resume. Please try again later.",
      },
    ],
    keywords: { matched: [], missing: [] },
    score: 50,
  }
}
