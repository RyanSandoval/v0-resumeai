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
    console.log("Starting resume analysis with local processing")

    // Extract keywords from job description
    const extractedKeywords = extractKeywordsFromJobDescription(jobDescription)

    // Combine with user-provided keywords
    const allKeywords = [...new Set([...keywords, ...extractedKeywords])]

    // Find matching and missing keywords
    const matchedKeywords = allKeywords.filter((keyword) => resumeText.toLowerCase().includes(keyword.toLowerCase()))
    const missingKeywords = allKeywords.filter((keyword) => !resumeText.toLowerCase().includes(keyword.toLowerCase()))

    // Generate optimized text by enhancing the entire resume
    const optimizedText = enhanceEntireResume(resumeText, jobDescription, missingKeywords)

    // Generate changes based on the modifications
    const changes = generateChanges(resumeText, optimizedText, missingKeywords, jobDescription)

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

// Enhance the entire resume based on job description
function enhanceEntireResume(resumeText: string, jobDescription: string, missingKeywords: string[]): string {
  // Identify resume sections
  const sections = identifyResumeSections(resumeText)

  // Create a copy of the resume text to modify
  let optimizedText = resumeText

  // Enhance the summary section if it exists
  if (sections.summary) {
    optimizedText = enhanceSummarySection(optimizedText, sections.summary, jobDescription, missingKeywords)
  }

  // Enhance the experience section
  if (sections.experience) {
    optimizedText = enhanceExperienceSection(optimizedText, sections.experience, jobDescription, missingKeywords)
  }

  // Enhance the skills section or add one if it doesn't exist
  if (sections.skills) {
    optimizedText = enhanceSkillsSection(optimizedText, sections.skills, missingKeywords)
  } else {
    // Add a skills section with relevant keywords
    optimizedText = addSkillsSection(optimizedText, missingKeywords)
  }

  // Improve overall language and tone
  optimizedText = improveLanguageAndTone(optimizedText)

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

// Enhance the summary section
function enhanceSummarySection(
  resumeText: string,
  section: { start: number; end: number },
  jobDescription: string,
  missingKeywords: string[],
): string {
  const lines = resumeText.split("\n")
  const summaryLines = lines.slice(section.start, section.end + 1)

  // Extract the summary content (skip the header)
  const summaryContent = summaryLines.slice(1).join(" ").trim()

  // Create an enhanced summary that's more natural and includes relevant keywords
  let enhancedSummary = summaryContent

  // Make sure the summary isn't too long
  if (enhancedSummary.length > 50) {
    // Add 1-2 relevant keywords naturally if they're missing
    const keywordsToAdd = missingKeywords.slice(0, 2)

    if (keywordsToAdd.length > 0) {
      // Don't just append keywords; integrate them naturally
      const phrases = [
        `with expertise in ${keywordsToAdd.join(" and ")}`,
        `specializing in ${keywordsToAdd.join(" and ")}`,
        `focusing on ${keywordsToAdd.join(" and ")}`,
      ]

      // Choose a random phrase to make it sound more natural
      const phrase = phrases[Math.floor(Math.random() * phrases.length)]

      // Find a good spot to insert the phrase
      if (enhancedSummary.includes(".")) {
        // Insert before the last period
        const lastPeriodIndex = enhancedSummary.lastIndexOf(".")
        enhancedSummary =
          enhancedSummary.substring(0, lastPeriodIndex) + " " + phrase + enhancedSummary.substring(lastPeriodIndex)
      } else {
        // Append to the end
        enhancedSummary += " " + phrase + "."
      }
    }

    // Improve the language to sound more natural
    enhancedSummary = enhancedSummary
      .replace(/utilize/gi, "use")
      .replace(/implement/gi, "build")
      .replace(/facilitate/gi, "enable")
      .replace(/leverage/gi, "apply")
  }

  // Replace the summary content
  lines.splice(section.start + 1, section.end - section.start, enhancedSummary)

  return lines.join("\n")
}

// Enhance the experience section
function enhanceExperienceSection(
  resumeText: string,
  section: { start: number; end: number },
  jobDescription: string,
  missingKeywords: string[],
): string {
  const lines = resumeText.split("\n")
  const experienceLines = lines.slice(section.start, section.end + 1)

  // Find bullet points in the experience section
  const bulletPoints: { index: number; text: string }[] = []

  for (let i = 0; i < experienceLines.length; i++) {
    const line = experienceLines[i].trim()
    if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
      bulletPoints.push({
        index: section.start + i,
        text: line,
      })
    }
  }

  // Enhance bullet points to be more engaging and natural
  bulletPoints.forEach((point) => {
    const originalText = point.text

    // Remove the bullet character
    let text = originalText.replace(/^[•\-*]\s*/, "")

    // Ensure it starts with an action verb
    const firstWord = text
      .split(" ")[0]
      .toLowerCase()
      .replace(/[,.;:]/, "")
    const actionVerbs = [
      "led",
      "managed",
      "developed",
      "created",
      "implemented",
      "designed",
      "analyzed",
      "improved",
      "increased",
      "reduced",
      "achieved",
      "delivered",
    ]

    if (!actionVerbs.includes(firstWord)) {
      // Choose an appropriate action verb
      const verb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)]
      text = verb + " " + text.charAt(0).toLowerCase() + text.slice(1)
    }

    // Make language more natural and less formal
    text = text
      .replace(/utilize/gi, "use")
      .replace(/implement/gi, "build")
      .replace(/facilitate/gi, "enable")
      .replace(/leverage/gi, "apply")
      .replace(/in order to/gi, "to")

    // Add a relevant keyword if possible
    const relevantKeyword = missingKeywords.find(
      (keyword) => !text.toLowerCase().includes(keyword.toLowerCase()) && Math.random() > 0.7, // Only add to some bullet points
    )

    if (relevantKeyword) {
      // Add the keyword naturally
      const phrases = [`using ${relevantKeyword}`, `with ${relevantKeyword}`, `including ${relevantKeyword}`]

      const phrase = phrases[Math.floor(Math.random() * phrases.length)]

      // Add to the end if it doesn't end with punctuation
      if (!/[.,:;]$/.test(text)) {
        text += ", " + phrase
      } else {
        // Insert before the punctuation
        text = text.replace(/[.,:;]$/, ", " + phrase + "$&")
      }
    }

    // Replace the original bullet point
    lines[point.index] = originalText.replace(/^([•\-*]\s*).*$/, `$1${text}`)
  })

  return lines.join("\n")
}

// Enhance the skills section
function enhanceSkillsSection(
  resumeText: string,
  section: { start: number; end: number },
  missingKeywords: string[],
): string {
  const lines = resumeText.split("\n")

  // Use a mutable variable for insertion position
  let insertPosition = section.end + 1

  // Add missing keywords as skills
  const keywordsToAdd = missingKeywords.filter(
    (keyword) =>
      !lines.slice(section.start, section.end + 1).some((line) => line.toLowerCase().includes(keyword.toLowerCase())),
  )

  if (keywordsToAdd.length > 0) {
    // Group keywords by category if possible
    const technicalKeywords = keywordsToAdd.filter((keyword) =>
      /\b(language|framework|tool|software|technology|programming|database|cloud|platform)\b/i.test(keyword),
    )

    const softSkillKeywords = keywordsToAdd.filter((keyword) => !technicalKeywords.includes(keyword))

    // Add technical skills
    if (technicalKeywords.length > 0) {
      lines.splice(insertPosition, 0, `• Technical: ${technicalKeywords.join(", ")}`)
      insertPosition += 1
    }

    // Add soft skills
    if (softSkillKeywords.length > 0) {
      lines.splice(insertPosition, 0, `• Additional: ${softSkillKeywords.join(", ")}`)
      insertPosition += 1
    }
  }

  return lines.join("\n")
}

// Add a skills section if it doesn't exist
function addSkillsSection(resumeText: string, keywords: string[]): string {
  if (keywords.length === 0) {
    return resumeText
  }

  // Group keywords by category
  const technicalKeywords = keywords.filter((keyword) =>
    /\b(language|framework|tool|software|technology|programming|database|cloud|platform)\b/i.test(keyword),
  )

  const softSkillKeywords = keywords.filter((keyword) => !technicalKeywords.includes(keyword))

  // Create the skills section
  let skillsSection = "\n\nSKILLS\n"

  if (technicalKeywords.length > 0) {
    skillsSection += `• Technical: ${technicalKeywords.join(", ")}\n`
  }

  if (softSkillKeywords.length > 0) {
    skillsSection += `• Additional: ${softSkillKeywords.join(", ")}\n`
  }

  return resumeText + skillsSection
}

// Improve overall language and tone
function improveLanguageAndTone(text: string): string {
  return text
    .replace(/utilize/gi, "use")
    .replace(/implement/gi, "build")
    .replace(/facilitate/gi, "enable")
    .replace(/leverage/gi, "apply")
    .replace(/in order to/gi, "to")
    .replace(/due to the fact that/gi, "because")
    .replace(/a large number of/gi, "many")
    .replace(/a majority of/gi, "most")
    .replace(/at this point in time/gi, "now")
    .replace(/for the purpose of/gi, "for")
}

// Generate changes based on modifications
function generateChanges(
  originalText: string,
  optimizedText: string,
  missingKeywords: string[],
  jobDescription: string,
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

  // Identify sections in both texts
  const originalSections = identifyResumeSections(originalText)
  const optimizedSections = identifyResumeSections(optimizedText)

  // Check for summary changes
  if (originalSections.summary && optimizedSections.summary) {
    const originalSummary = originalText
      .split("\n")
      .slice(originalSections.summary.start, originalSections.summary.end + 1)
      .join("\n")

    const optimizedSummary = optimizedText
      .split("\n")
      .slice(optimizedSections.summary.start, optimizedSections.summary.end + 1)
      .join("\n")

    if (originalSummary !== optimizedSummary) {
      changes.push({
        type: "modification",
        section: "Summary",
        description: "Enhanced professional summary to better align with job requirements",
      })
    }
  }

  // Check for experience changes
  if (originalSections.experience && optimizedSections.experience) {
    const originalExperience = originalText
      .split("\n")
      .slice(originalSections.experience.start, originalSections.experience.end + 1)
      .join("\n")

    const optimizedExperience = optimizedText
      .split("\n")
      .slice(optimizedSections.experience.start, optimizedSections.experience.end + 1)
      .join("\n")

    if (originalExperience !== optimizedExperience) {
      changes.push({
        type: "modification",
        section: "Experience",
        description: "Improved bullet points to highlight relevant achievements and skills",
      })
    }
  }

  // Check for skills changes
  if ((originalSections.skills && optimizedSections.skills) || (!originalSections.skills && optimizedSections.skills)) {
    if (!originalSections.skills) {
      changes.push({
        type: "addition",
        section: "Skills",
        description: "Added skills section with relevant keywords from job description",
      })
    } else {
      const originalSkills = originalText
        .split("\n")
        .slice(originalSections.skills.start, originalSections.skills.end + 1)
        .join("\n")

      const optimizedSkills = optimizedText
        .split("\n")
        .slice(optimizedSections.skills.start, optimizedSections.skills.end + 1)
        .join("\n")

      if (originalSkills !== optimizedSkills) {
        changes.push({
          type: "modification",
          section: "Skills",
          description: "Enhanced skills section with relevant keywords from job description",
        })
      }
    }
  }

  // Add changes for specific keywords
  missingKeywords.slice(0, 3).forEach((keyword) => {
    changes.push({
      type: "addition",
      section: "Keywords",
      description: `Added "${keyword}" to highlight relevant expertise`,
    })
  })

  // Add general language improvement change
  changes.push({
    type: "modification",
    section: "Language",
    description: "Improved overall language to sound more natural and engaging",
  })

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
