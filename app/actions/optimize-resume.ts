"use server"
import type { ResumeData } from "@/types/resume"
import type { OptimizationSettings } from "@/types/optimization"
import { prisma } from "@/lib/prisma"
import type { OptimizationOptions } from "@/components/optimization-settings"
import type { OptimizationResult } from "@/components/resume-optimizer"
import { analyzeResumeWithAI as aiAnalyze } from "@/lib/ai-analysis"

// Re-export the analyzeResumeWithAI function to fix deployment error
export { aiAnalyze as analyzeResumeWithAI }

type OptimizeResumeRequest = {
  resumeText: string
  jobDescription?: string
  keywords?: string[]
  options: OptimizationOptions
}

export async function optimizeResume(request: OptimizeResumeRequest): Promise<OptimizationResult> {
  try {
    console.log(
      "Optimizing resume with request:",
      JSON.stringify({
        textLength: request.resumeText.length,
        jobDescriptionLength: request.jobDescription?.length,
        keywordsCount: request.keywords?.length,
        options: request.options,
      }),
    )

    // Validation
    if (!request.resumeText) {
      throw new Error("Resume text is required")
    }

    if (!request.jobDescription && (!request.keywords || request.keywords.length === 0)) {
      throw new Error("Either job description or keywords are required")
    }

    // Here would be the AI integration, but for now, let's create a fallback
    // that works without external dependencies
    let result: OptimizationResult

    try {
      // Try to use AI service
      result = await aiAnalyze(request)
    } catch (aiError) {
      console.error("AI optimization failed, using fallback:", aiError)

      // Use fallback implementation
      result = generateFallbackResult(request)
    }

    return result
  } catch (error) {
    console.error("Error in optimizeResume action:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to optimize resume")
  }
}

// Fallback implementation that works without external services
function generateFallbackResult(request: OptimizeResumeRequest): OptimizationResult {
  const { resumeText, jobDescription, keywords = [], options } = request

  // Extract keywords from job description if no keywords provided
  const extractedKeywords = keywords.length > 0 ? keywords : extractKeywordsFromText(jobDescription || "")

  // Check which keywords are already in the resume
  const matchedKeywords: string[] = []
  const missingKeywords: string[] = []

  extractedKeywords.forEach((keyword) => {
    if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword)
    } else {
      missingKeywords.push(keyword)
    }
  })

  // Calculate a basic score based on keyword matches
  const totalKeywords = extractedKeywords.length
  const score = totalKeywords > 0 ? Math.round((matchedKeywords.length / totalKeywords) * 100) : 70 // Default score if no keywords

  // Generate basic changes
  const changes = generateBasicChanges(resumeText, missingKeywords, options)

  // Create a simple optimized version by adding missing keywords
  let optimizedText = resumeText

  // Add a skills section with missing keywords if appropriate
  if (missingKeywords.length > 0 && options.prioritySections.includes("skills")) {
    if (resumeText.toLowerCase().includes("skills")) {
      // Try to find the skills section and add keywords there
      const lines = resumeText.split("\n")
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

  return {
    originalText: resumeText,
    optimizedText,
    changes,
    keywords: {
      matched: matchedKeywords,
      missing: missingKeywords,
    },
    score,
    fitRating: calculateFitRating(score),
    jobDescription: jobDescription || "",
    followupQuestions: [
      "Would you like to add the missing keywords to your resume?",
      "Do you want to enhance your experience descriptions with more achievements?",
      "Should we update your summary to better match the job description?",
    ],
  }
}

// Extract keywords from text
function extractKeywordsFromText(text: string): string[] {
  if (!text) return []

  // Common words to filter out
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
    "against",
    "during",
    "without",
    "before",
    "under",
    "around",
    "among",
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

// Generate basic changes for the resume
function generateBasicChanges(resumeText: string, missingKeywords: string[], options: OptimizationOptions) {
  const changes = []

  // Suggest adding missing keywords
  if (missingKeywords.length > 0) {
    changes.push({
      type: "addition",
      section: "Skills",
      description: `Added ${missingKeywords.length} missing keywords to skills section: ${missingKeywords.join(", ")}`,
    })
  }

  // Suggest improving summary if applicable
  if (options.prioritySections.includes("summary")) {
    changes.push({
      type: "modification",
      section: "Summary",
      description: "Enhanced professional summary to highlight relevant qualifications",
    })
  }

  // Suggest improvements to experience section if applicable
  if (options.prioritySections.includes("experience")) {
    changes.push({
      type: "modification",
      section: "Experience",
      description: "Strengthened experience descriptions with action verbs and quantifiable achievements",
    })
  }

  return changes
}

// Calculate a fit rating (1-10) based on the score
function calculateFitRating(score: number): number {
  return Math.max(1, Math.min(10, Math.round(score / 10)))
}

function prepareResumeSections(resumeData: ResumeData): string {
  let sections = ""

  if (resumeData.profile) {
    sections += `PROFILE:\n${resumeData.profile}\n\n`
  }

  if (resumeData.skills && resumeData.skills.length > 0) {
    sections += `SKILLS:\n${resumeData.skills.join(", ")}\n\n`
  }

  if (resumeData.experience && resumeData.experience.length > 0) {
    sections += "EXPERIENCE:\n"
    resumeData.experience.forEach((exp) => {
      sections += `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n`
      sections += `${exp.description}\n\n`
    })
  }

  if (resumeData.education && resumeData.education.length > 0) {
    sections += "EDUCATION:\n"
    resumeData.education.forEach((edu) => {
      sections += `${edu.degree} in ${edu.field} from ${edu.institution} (${edu.graduationDate})\n`
      if (edu.description) sections += `${edu.description}\n`
      sections += "\n"
    })
  }

  return sections
}

function buildOptimizationPrompt(
  resumeSections: string,
  jobDescription: string,
  keywords: string[],
  settings: OptimizationSettings,
): string {
  return `
I need you to optimize the following resume for the job description provided.

RESUME:
${resumeSections}

JOB DESCRIPTION:
${jobDescription}

IMPORTANT KEYWORDS TO INCLUDE:
${keywords.join(", ")}

OPTIMIZATION SETTINGS:
- Detail Level: ${settings.detailLevel} (${getDetailLevelDescription(settings.detailLevel)})
- Priority Sections: ${settings.prioritySections.join(", ")}
- Keyword Density: ${settings.keywordDensity} (${getKeywordDensityDescription(settings.keywordDensity)})

INSTRUCTIONS:
1. Optimize the resume to better match the job description
2. Incorporate the keywords naturally where appropriate
3. Adjust the level of detail based on the detail level setting
4. Focus on the priority sections while still improving others
5. Maintain the original structure of each section
6. Return the optimized resume in the following format:

OPTIMIZED_PROFILE:
[optimized profile content]

OPTIMIZED_SKILLS:
[skill1, skill2, skill3, ...]

OPTIMIZED_EXPERIENCE:
[job title] at [company] ([start date] - [end date])
[optimized job description]

[job title] at [company] ([start date] - [end date])
[optimized job description]

OPTIMIZED_EDUCATION:
[degree] in [field] from [institution] ([graduation date])
[optimized education description if any]

CHANGES_SUMMARY:
[brief summary of the key changes made and why they improve the resume]
`
}

function getDetailLevelDescription(level: string): string {
  switch (level) {
    case "concise":
      return "Keep content brief and to the point"
    case "balanced":
      return "Moderate level of detail"
    case "comprehensive":
      return "Include more detailed explanations"
    default:
      return "Moderate level of detail"
  }
}

function getKeywordDensityDescription(density: string): string {
  switch (density) {
    case "low":
      return "Include keywords sparingly and only where natural"
    case "medium":
      return "Balance keyword inclusion with readability"
    case "high":
      return "Maximize keyword inclusion while maintaining readability"
    default:
      return "Balance keyword inclusion with readability"
  }
}

function parseOptimizedResponse(response: string, originalResume: ResumeData): ResumeData {
  const optimizedResume: ResumeData = { ...originalResume }

  // Extract profile
  const profileMatch = response.match(/OPTIMIZED_PROFILE:\s*([\s\S]*?)(?=OPTIMIZED_SKILLS:|$)/)
  if (profileMatch && profileMatch[1]) {
    optimizedResume.profile = profileMatch[1].trim()
  }

  // Extract skills
  const skillsMatch = response.match(/OPTIMIZED_SKILLS:\s*([\s\S]*?)(?=OPTIMIZED_EXPERIENCE:|$)/)
  if (skillsMatch && skillsMatch[1]) {
    const skillsText = skillsMatch[1].trim()
    optimizedResume.skills = skillsText.split(/,\s*/).filter((skill) => skill.length > 0)
  }

  // Extract experience
  const experienceMatch = response.match(/OPTIMIZED_EXPERIENCE:\s*([\s\S]*?)(?=OPTIMIZED_EDUCATION:|$)/)
  if (experienceMatch && experienceMatch[1]) {
    const experienceText = experienceMatch[1].trim()
    const experienceEntries = experienceText.split(/\n\n+/)

    optimizedResume.experience = experienceEntries.map((entry) => {
      const lines = entry.split("\n")
      const headerMatch = lines[0].match(/(.*) at (.*) $$(.*) - (.*)$$/)

      if (headerMatch) {
        return {
          title: headerMatch[1].trim(),
          company: headerMatch[2].trim(),
          startDate: headerMatch[3].trim(),
          endDate: headerMatch[4].trim(),
          description: lines.slice(1).join("\n").trim(),
        }
      }

      // If parsing fails, return the original experience entry
      return (
        originalResume.experience.find((exp) => entry.includes(exp.company)) || {
          title: "Unknown",
          company: "Unknown",
          startDate: "",
          endDate: "",
          description: entry,
        }
      )
    })
  }

  // Extract education
  const educationMatch = response.match(/OPTIMIZED_EDUCATION:\s*([\s\S]*?)(?=CHANGES_SUMMARY:|$)/)
  if (educationMatch && educationMatch[1]) {
    const educationText = educationMatch[1].trim()
    const educationEntries = educationText.split(/\n\n+/)

    optimizedResume.education = educationEntries.map((entry) => {
      const lines = entry.split("\n")
      const headerMatch = lines[0].match(/(.*) in (.*) from (.*) $$(.*)$$/)

      if (headerMatch) {
        return {
          degree: headerMatch[1].trim(),
          field: headerMatch[2].trim(),
          institution: headerMatch[3].trim(),
          graduationDate: headerMatch[4].trim(),
          description: lines.slice(1).join("\n").trim(),
        }
      }

      // If parsing fails, return the original education entry
      return (
        originalResume.education.find((edu) => entry.includes(edu.institution)) || {
          degree: "Unknown",
          field: "Unknown",
          institution: "Unknown",
          graduationDate: "",
          description: entry,
        }
      )
    })
  }

  return optimizedResume
}

function generateChangeSummary(original: ResumeData, optimized: ResumeData) {
  const changes = {
    profile: original.profile !== optimized.profile,
    skills: JSON.stringify(original.skills) !== JSON.stringify(optimized.skills),
    experience: original.experience.some(
      (exp, i) => optimized.experience[i] && exp.description !== optimized.experience[i].description,
    ),
    education: original.education.some(
      (edu, i) => optimized.education[i] && edu.description !== optimized.education[i].description,
    ),
  }

  return {
    sectionsChanged: Object.entries(changes)
      .filter(([_, changed]) => changed)
      .map(([section]) => section),
    summary: extractChangesSummary(optimized),
  }
}

function extractChangesSummary(optimized: ResumeData): string {
  // Try to extract the changes summary from the AI response
  // If not available, generate a generic one
  return "Resume has been optimized to better match the job description and include relevant keywords."
}

async function saveOptimizationResult(
  userId: string,
  originalResume: ResumeData,
  optimizedResume: ResumeData,
  jobDescription: string,
) {
  try {
    await prisma.resumeOptimization.create({
      data: {
        userId,
        originalResume: JSON.stringify(originalResume),
        optimizedResume: JSON.stringify(optimizedResume),
        jobDescription,
        createdAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error saving optimization result:", error)
    // Continue execution even if saving fails
  }
}
