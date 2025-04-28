import type { OptimizationOptions, OptimizationResult } from "@/components/resume-optimizer"
import { analyzeResumeWithAI } from "@/app/actions/optimize-resume"

interface OptimizeResumeParams {
  resumeText: string
  resumeType: string
  jobDescription: string
  keywords: string[]
  options: OptimizationOptions
}

export async function optimizeResume({
  resumeText,
  resumeType,
  jobDescription,
  keywords,
  options,
}: OptimizeResumeParams): Promise<OptimizationResult> {
  try {
    // Extract keywords from job description if no job description is provided
    const extractedKeywords: string[] = []

    if (!jobDescription && keywords.length === 0) {
      // Fallback to simple keyword extraction if no job description or keywords provided
      return generateFallbackResult(resumeText)
    }

    // Use AI to analyze and optimize the resume
    const result = await analyzeResumeWithAI({
      resumeText,
      jobDescription,
      keywords,
      options,
    })

    return result
  } catch (error) {
    console.error("Error optimizing resume:", error)

    // Fallback to the simple optimization if AI fails
    return generateFallbackResult(resumeText)
  }
}

// Calculate match score based on keywords
export function calculateMatchScore(matchedKeywords: number, totalKeywords: number): number {
  if (totalKeywords === 0) return 75 // Default score if no keywords

  // Base score on keyword matches
  const baseScore = Math.round((matchedKeywords / totalKeywords) * 100)

  // Ensure score is between 50-95
  return Math.min(Math.max(baseScore, 50), 95)
}

// Fallback function that generates a basic result without AI
function generateFallbackResult(resumeText: string): OptimizationResult {
  return {
    originalText: resumeText,
    optimizedText: resumeText,
    changes: [
      {
        type: "modification",
        section: "General",
        description: "Unable to optimize resume. Please try again later.",
      },
    ],
    keywords: {
      matched: [],
      missing: [],
    },
    score: 0,
  }
}

function generateSpecificChanges(resumeText: string, missingKeywords: string[], options: OptimizationOptions) {
  // Identify resume sections more accurately
  const resumeLines = resumeText.split("\n")
  const sections: Record<string, { start: number; end: number; content: string }> = {}

  // Common section headers in resumes
  const sectionHeaders = [
    { name: "summary", patterns: ["summary", "professional summary", "profile", "about me"] },
    {
      name: "experience",
      patterns: ["experience", "work experience", "employment history", "work history", "professional experience"],
    },
    { name: "skills", patterns: ["skills", "technical skills", "core competencies", "key skills", "expertise"] },
    { name: "education", patterns: ["education", "academic background", "educational background"] },
    { name: "projects", patterns: ["projects", "key projects", "relevant projects"] },
    { name: "certifications", patterns: ["certifications", "certificates", "professional certifications"] },
  ]

  // Identify section boundaries
  let currentSection = ""
  let currentSectionStart = 0

  resumeLines.forEach((line, index) => {
    const trimmedLine = line.trim().toLowerCase()

    // Check if this line is a section header
    for (const header of sectionHeaders) {
      if (
        header.patterns.some(
          (pattern) => trimmedLine.includes(pattern) && (trimmedLine.length < 30 || trimmedLine === pattern),
        )
      ) {
        // If we were in a section, mark its end
        if (currentSection) {
          sections[currentSection] = {
            start: currentSectionStart,
            end: index - 1,
            content: resumeLines.slice(currentSectionStart, index).join("\n"),
          }
        }

        // Start new section
        currentSection = header.name
        currentSectionStart = index
        break
      }
    }

    // If we're at the end, close the final section
    if (index === resumeLines.length - 1 && currentSection) {
      sections[currentSection] = {
        start: currentSectionStart,
        end: index,
        content: resumeLines.slice(currentSectionStart, index + 1).join("\n"),
      }
    }
  })

  const prioritySections = options.prioritySections
  const changes: Array<{
    type: "addition" | "modification"
    section: string
    description: string
  }> = []

  // Generate specific changes for each missing keyword
  missingKeywords.forEach((keyword) => {
    // Determine best section for this keyword
    let targetSection = ""

    // Technical skills usually go in skills section
    if (/\b(language|framework|tool|software|technology|programming|database|cloud|platform)\b/i.test(keyword)) {
      targetSection = "skills"
    }
    // Education-related keywords
    else if (/\b(degree|university|college|education|gpa|graduate|certification)\b/i.test(keyword)) {
      targetSection = "education"
    }
    // Experience-related keywords
    else if (
      /\b(led|managed|developed|implemented|created|designed|analyzed|improved|increased|reduced|team|project)\b/i.test(
        keyword,
      )
    ) {
      targetSection = "experience"
    }
    // Default to priority sections if no specific match
    else {
      for (const section of prioritySections) {
        if (sections[section]) {
          targetSection = section
          break
        }
      }
    }

    // If we couldn't find a target section, use the first available one
    if (!targetSection) {
      targetSection = Object.keys(sections)[0] || "experience"
    }

    // Format section name for display
    const displaySection = targetSection.charAt(0).toUpperCase() + targetSection.slice(1)

    // Generate a specific change description based on the keyword and section
    let changeDescription = ""

    if (targetSection === "skills") {
      changeDescription = `Added "${keyword}" to highlight relevant technical expertise`
    } else if (targetSection === "experience") {
      changeDescription = `Enhanced description to showcase experience with "${keyword}"`
    } else if (targetSection === "summary") {
      changeDescription = `Incorporated "${keyword}" into professional summary to align with job requirements`
    } else if (targetSection === "education") {
      changeDescription = `Highlighted education relevant to "${keyword}"`
    } else if (targetSection === "projects") {
      changeDescription = `Added project details demonstrating "${keyword}" skills`
    } else {
      changeDescription = `Added "${keyword}" to ${displaySection.toLowerCase()} section`
    }

    changes.push({
      type: "modification",
      section: displaySection,
      description: changeDescription,
    })
  })

  // Add general improvements based on options
  if (options.detailLevel === "detailed") {
    changes.push({
      type: "modification",
      section: "Experience",
      description: "Added specific metrics and quantifiable achievements to demonstrate impact",
    })
  }

  if (options.keywordDensity === "high") {
    changes.push({
      type: "modification",
      section: "Summary",
      description: "Optimized professional summary with key terms from job description",
    })
  }

  return changes
}

function generateOptimizedText(originalText: string, changes: any[], missingKeywords: string[]): string {
  // In a real implementation with AI, this would intelligently modify the text
  // For this demo, we'll make more specific changes to simulate AI-powered optimization

  const lines = originalText.split("\n")
  const modifiedLines = [...lines]

  // Identify resume sections
  const sections: Record<string, { start: number; end: number }> = {}
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

  // Apply changes to specific sections
  changes.forEach((change) => {
    const sectionName = change.section.toLowerCase()
    const section = sections[sectionName]

    if (section) {
      // Find appropriate place to make changes
      if (sectionName === "summary") {
        // For summary, enhance the entire section
        const summaryContent = lines.slice(section.start + 1, section.end + 1).join(" ")
        const enhancedSummary = enhanceSummary(summaryContent, missingKeywords)

        // Replace the summary with enhanced version
        modifiedLines.splice(section.start + 1, section.end - section.start, enhancedSummary)

        // Update section indices for subsequent changes
        updateSectionIndices(sections, section.start + 1, section.end - section.start, 1)
      } else if (sectionName === "skills") {
        // For skills, add missing keywords
        const skillsToAdd = missingKeywords.filter(
          (keyword) =>
            !lines
              .slice(section.start, section.end + 1)
              .some((line) => line.toLowerCase().includes(keyword.toLowerCase())),
        )

        if (skillsToAdd.length > 0) {
          // Find a good place to insert skills
          const insertIndex = section.start + 1

          // Group skills by category if possible
          const technicalSkills = skillsToAdd.filter((skill) =>
            /\b(language|framework|tool|software|technology|programming|database|cloud|platform)\b/i.test(skill),
          )

          const softSkills = skillsToAdd.filter((skill) => !technicalSkills.includes(skill))

          if (technicalSkills.length > 0) {
            modifiedLines.splice(insertIndex, 0, `• Technical: ${technicalSkills.join(", ")}`)
            updateSectionIndices(sections, insertIndex, 0, 1)
          }

          if (softSkills.length > 0) {
            modifiedLines.splice(
              insertIndex + (technicalSkills.length > 0 ? 1 : 0),
              0,
              `• Additional: ${softSkills.join(", ")}`,
            )
            updateSectionIndices(sections, insertIndex + (technicalSkills.length > 0 ? 1 : 0), 0, 1)
          }
        }
      } else if (sectionName === "experience") {
        // For experience, enhance bullet points with keywords
        const experienceLines = lines.slice(section.start, section.end + 1)
        const bulletPoints: number[] = []

        // Find bullet points
        experienceLines.forEach((line, idx) => {
          if (/^\s*[•\-*–]\s/.test(line)) {
            bulletPoints.push(section.start + idx)
          }
        })

        // Enhance some bullet points with keywords
        if (bulletPoints.length > 0) {
          const keywordsToAdd = [...missingKeywords]
          const enhancedCount = Math.min(bulletPoints.length, keywordsToAdd.length, 3)

          for (let i = 0; i < enhancedCount; i++) {
            const bulletIndex = bulletPoints[i]
            const originalBullet = modifiedLines[bulletIndex]
            const keyword = keywordsToAdd[i]

            // Enhance the bullet point with the keyword
            modifiedLines[bulletIndex] = enhanceBulletPoint(originalBullet, keyword)
          }
        }
      } else {
        // For other sections, add a relevant bullet point
        const relevantKeywords = missingKeywords.filter((keyword) =>
          change.description.toLowerCase().includes(keyword.toLowerCase()),
        )

        if (relevantKeywords.length > 0) {
          const insertIndex = section.end
          const keyword = relevantKeywords[0]

          let newBulletPoint = ""

          if (sectionName === "education") {
            newBulletPoint = `• Relevant coursework: ${keyword} and related subjects`
          } else if (sectionName === "projects") {
            newBulletPoint = `• Utilized ${keyword} to develop innovative solutions`
          } else if (sectionName === "certifications") {
            newBulletPoint = `• Currently pursuing certification in ${keyword}`
          } else {
            newBulletPoint = `• Demonstrated proficiency in ${keyword}`
          }

          modifiedLines.splice(insertIndex, 0, newBulletPoint)
          updateSectionIndices(sections, insertIndex, 0, 1)
        }
      }
    }
  })

  return modifiedLines.join("\n")
}

// Helper function to update section indices after insertions or deletions
function updateSectionIndices(
  sections: Record<string, { start: number; end: number }>,
  fromIndex: number,
  removedLines: number,
  addedLines: number,
) {
  const delta = addedLines - removedLines

  if (delta === 0) return

  for (const section of Object.values(sections)) {
    if (section.start > fromIndex) {
      section.start += delta
    }
    if (section.end >= fromIndex) {
      section.end += delta
    }
  }
}

// Helper function to enhance a summary with keywords
function enhanceSummary(summary: string, keywords: string[]): string {
  // In a real implementation, this would use AI to rewrite the summary
  // For this demo, we'll do a simple enhancement

  if (keywords.length === 0) return summary

  const relevantKeywords = keywords.slice(0, 3)
  const keywordPhrase =
    relevantKeywords.length === 1
      ? relevantKeywords[0]
      : relevantKeywords.length === 2
        ? `${relevantKeywords[0]} and ${relevantKeywords[1]}`
        : `${relevantKeywords[0]}, ${relevantKeywords[1]}, and ${relevantKeywords[2]}`

  // Check if summary ends with a period
  const endsWithPeriod = summary.trim().endsWith(".")
  const enhancedSummary =
    summary.trim() +
    (endsWithPeriod ? " " : ". ") +
    `Proficient in ${keywordPhrase} with a proven track record of delivering results.`

  return enhancedSummary
}

// Helper function to enhance a bullet point with a keyword
function enhanceBulletPoint(bulletPoint: string, keyword: string): string {
  // In a real implementation, this would use AI to rewrite the bullet point
  // For this demo, we'll do a simple enhancement

  // Check if the bullet point already contains the keyword
  if (bulletPoint.toLowerCase().includes(keyword.toLowerCase())) {
    return bulletPoint
  }

  // Different enhancement patterns
  const patterns = [
    `${bulletPoint} utilizing ${keyword}`,
    `${bulletPoint} with expertise in ${keyword}`,
    `${bulletPoint}, demonstrating proficiency in ${keyword}`,
    `${bulletPoint} through application of ${keyword}`,
  ]

  // Select a random pattern
  const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)]

  return selectedPattern
}
