"use server"

import { getXaiClient } from "@/lib/xai-client"
import type { ResumeData } from "@/types/resume"
import type { OptimizationSettings } from "@/types/optimization"
import { trackFeatureUsage } from "./track-feature-usage"
import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import type { OptimizationOptions } from "@/components/resume-optimizer"
import type { OptimizationResult } from "@/components/resume-optimizer"

// Add the analyzeResumeWithAI function to fix deployment error
export async function analyzeResumeWithAI({
  resumeText,
  jobDescription,
  keywords,
  options,
  additionalInfo = {},
}: {
  resumeText: string
  jobDescription: string
  keywords: string[]
  options: OptimizationOptions
  additionalInfo?: Record<string, any>
}): Promise<OptimizationResult> {
  try {
    // Use the optimizeResume function internally
    const result = await optimizeResume(
      {
        profile: resumeText,
        skills: keywords,
        experience: [],
        education: [],
      },
      jobDescription,
      keywords,
      {
        detailLevel:
          options.detailLevel === "minimal"
            ? "concise"
            : options.detailLevel === "moderate"
              ? "balanced"
              : "comprehensive",
        prioritySections: options.prioritySections,
        keywordDensity: options.keywordDensity,
      },
    )

    // Convert the result to the expected format
    return {
      originalText: resumeText,
      optimizedText: result.optimized.profile || resumeText,
      jobDescription,
      changes: result.changes.sectionsChanged.map((section) => ({
        type: "modification",
        section: section.charAt(0).toUpperCase() + section.slice(1),
        description: `Optimized ${section} section to better match job requirements.`,
      })),
      keywords: {
        matched: keywords.filter((k) => resumeText.toLowerCase().includes(k.toLowerCase())),
        missing: keywords.filter((k) => !resumeText.toLowerCase().includes(k.toLowerCase())),
      },
      score: 75, // Default score
      fitRating: 7, // Default rating
      followupQuestions: [
        "Would you like to further customize your resume for this position?",
        "Are there any specific skills you'd like to emphasize more?",
        "Would you like to add any additional sections to your resume?",
      ],
    }
  } catch (error) {
    console.error("Error in resume analysis:", error)
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
      fitRating: 5,
      followupQuestions: [
        "Would you like to try again with a different resume or job description?",
        "Is there a specific aspect of your resume you'd like to improve?",
      ],
    }
  }
}

export async function optimizeResume(
  resumeData: ResumeData,
  jobDescription: string,
  keywords: string[],
  settings: OptimizationSettings,
) {
  try {
    const session = await getSession()
    const userId = session?.user?.id

    if (!userId) {
      throw new Error("User not authenticated")
    }

    // Track feature usage
    await trackFeatureUsage(userId, "resume_optimization")

    // Initialize Grok AI client
    const xai = getXaiClient()

    if (!xai) {
      throw new Error("Failed to initialize AI client")
    }

    // Prepare resume sections for optimization
    const resumeSections = prepareResumeSections(resumeData)

    // Prepare the prompt for the AI
    const prompt = buildOptimizationPrompt(resumeSections, jobDescription, keywords, settings)

    console.log("Sending optimization request to AI...")

    // Call the AI model
    const response = await xai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume optimizer that helps job seekers tailor their resumes to specific job descriptions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "grok-1",
      temperature: 0.7,
      max_tokens: 4000,
    })

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No response from AI model")
    }

    // Parse the AI response
    const optimizedContent = response.choices[0].message.content

    if (!optimizedContent) {
      throw new Error("Empty response from AI model")
    }

    // Parse the optimized content into resume sections
    const optimizedResume = parseOptimizedResponse(optimizedContent, resumeData)

    // Save the optimization to the database
    await saveOptimizationResult(userId, resumeData, optimizedResume, jobDescription)

    return {
      original: resumeData,
      optimized: optimizedResume,
      changes: generateChangeSummary(resumeData, optimizedResume),
    }
  } catch (error) {
    console.error("Error in resume optimization:", error)
    throw new Error(`Failed to optimize resume: ${error.message}`)
  }
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
