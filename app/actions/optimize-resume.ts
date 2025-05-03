"use server"

import type { OptimizationOptions, OptimizationResult } from "@/components/resume-optimizer"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { checkFeatureUsage, incrementFeatureUsage } from "@/app/actions/track-feature-usage"

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
    // Check if user is authenticated
    const session = await getServerSession(authOptions)

    // Check feature usage if user is authenticated
    if (session?.user?.id) {
      const usageCheck = await checkFeatureUsage(session.user.id, "resume_optimizations")
      if (!usageCheck.allowed) {
        return {
          originalText: resumeText,
          optimizedText: resumeText,
          jobDescription,
          changes: [
            {
              type: "modification",
              section: "General",
              description:
                "You've reached your monthly limit for resume optimizations. Please upgrade your plan to continue.",
            },
          ],
          keywords: { matched: [], missing: [] },
          score: 0,
          fitRating: 0,
          followupQuestions: ["Would you like to upgrade your plan to continue optimizing your resume?"],
        }
      }
    }

    console.log("Starting enhanced resume analysis")

    // Extract keywords from job description
    const extractedKeywords = extractKeywordsFromJobDescription(jobDescription)

    // Combine with user-provided keywords
    const allKeywords = [...new Set([...keywords, ...extractedKeywords])]

    // Find matching and missing keywords
    const matchedKeywords = allKeywords.filter((keyword) => resumeText.toLowerCase().includes(keyword.toLowerCase()))
    const missingKeywords = allKeywords.filter((keyword) => !resumeText.toLowerCase().includes(keyword.toLowerCase()))

    // Generate optimized text following the specific rules
    const optimizationResult = enhanceResumeFollowingRules(
      resumeText,
      jobDescription,
      missingKeywords,
      options,
      additionalInfo,
    )

    // Calculate a match score
    const matchScore = calculateMatchScore(matchedKeywords.length, allKeywords.length)

    // Calculate fit rating out of 10
    const fitRating = calculateFitRating(resumeText, jobDescription, matchedKeywords, allKeywords)

    // Generate follow-up questions
    const followupQuestions = generateFollowupQuestions(resumeText, jobDescription, optimizationResult.optimizedText)

    // Increment feature usage if user is authenticated
    if (session?.user?.id) {
      await incrementFeatureUsage(session.user.id, "resume_optimizations")
    }

    console.log("Resume analysis complete")

    return {
      originalText: resumeText,
      optimizedText: optimizationResult.optimizedText,
      jobDescription,
      changes: optimizationResult.changes,
      keywords: {
        matched: matchedKeywords,
        missing: missingKeywords,
      },
      score: matchScore,
      fitRating,
      followupQuestions,
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
    "about",
    "above",
    "across",
    "after",
    "against",
    "along",
    "among",
    "around",
    "before",
    "behind",
    "below",
    "beneath",
    "beside",
    "between",
    "beyond",
    "during",
    "except",
    "inside",
    "into",
    "like",
    "near",
    "off",
    "onto",
    "out",
    "over",
    "past",
    "since",
    "through",
    "throughout",
    "under",
    "until",
    "upon",
    "within",
    "without",
    "according",
    "regarding",
    "concerning",
    "considering",
  ])

  const filteredWords = words.filter((word) => word.length > 3 && !commonWords.has(word))

  // Count word frequency
  const wordCounts: Record<string, number> = {}
  filteredWords.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  // Extract phrases (2-3 word combinations) that might be important
  const phrases: Record<string, number> = {}
  const jobDescWords = jobDescription.toLowerCase().split(/\s+/)

  for (let i = 0; i < jobDescWords.length - 1; i++) {
    // Two-word phrases
    if (jobDescWords[i].length > 3 && jobDescWords[i + 1].length > 3) {
      const phrase = `${jobDescWords[i]} ${jobDescWords[i + 1]}`
      phrases[phrase] = (phrases[phrase] || 0) + 1
    }

    // Three-word phrases
    if (
      i < jobDescWords.length - 2 &&
      jobDescWords[i].length > 3 &&
      jobDescWords[i + 1].length > 3 &&
      jobDescWords[i + 2].length > 3
    ) {
      const phrase = `${jobDescWords[i]} ${jobDescWords[i + 1]} ${jobDescWords[i + 2]}`
      phrases[phrase] = (phrases[phrase] || 0) + 1
    }
  }

  // Sort words by frequency and take top keywords
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0])

  // Sort phrases by frequency and take top phrases
  const sortedPhrases = Object.entries(phrases)
    .filter(([phrase, count]) => count > 1) // Only phrases that appear more than once
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0])

  // Combine top words and phrases
  const topWords = sortedWords.slice(0, 15)
  const topPhrases = sortedPhrases.slice(0, 10)

  return [...topWords, ...topPhrases]
}

// Enhanced resume optimization following specific rules
function enhanceResumeFollowingRules(
  resumeText: string,
  jobDescription: string,
  missingKeywords: string[],
  options: OptimizationOptions,
  additionalInfo: Record<string, any>,
): { optimizedText: string; changes: any[] } {
  // Identify resume sections
  const sections = identifyResumeSections(resumeText)

  // Create a copy of the resume text to modify
  let optimizedText = resumeText
  const changes: Array<{
    type: "addition" | "modification"
    section: string
    description: string
  }> = []

  // 1. Tailor resume to specific job posting
  if (sections.summary) {
    optimizedText = enhanceSummaryForJobFit(optimizedText, sections.summary, jobDescription, missingKeywords)
    changes.push({
      type: "modification",
      section: "Summary",
      description: "Tailored professional summary to align with job requirements",
    })
  }

  // 2. Analyze for ATS optimization
  optimizedText = optimizeForATS(optimizedText, jobDescription, missingKeywords)
  changes.push({
    type: "modification",
    section: "ATS Optimization",
    description: "Enhanced resume with ATS-friendly keywords and formatting",
  })

  // 3. Enhance experience section without exaggeration
  if (sections.experience) {
    optimizedText = enhanceExperienceNaturally(optimizedText, sections.experience, jobDescription, missingKeywords)
    changes.push({
      type: "modification",
      section: "Experience",
      description: "Improved bullet points to be more engaging and natural while highlighting relevant skills",
    })
  }

  // 4. Remove redundant phrasing
  optimizedText = removeRedundantPhrasing(optimizedText)
  changes.push({
    type: "modification",
    section: "Language",
    description: "Removed redundant phrasing and suggested more concise alternatives",
  })

  // 5. Make bullet points more engaging and natural
  optimizedText = makeLanguageMoreNatural(optimizedText)
  changes.push({
    type: "modification",
    section: "Tone",
    description: "Adjusted resume tone to sound more natural and engaging",
  })

  // 6. Replace generic phrases with compelling language
  optimizedText = replaceGenericPhrases(optimizedText)
  changes.push({
    type: "modification",
    section: "Phrasing",
    description: "Replaced generic phrases with more specific, compelling language",
  })

  // 7. Mix sentence structures for natural flow
  optimizedText = diversifySentenceStructures(optimizedText)
  changes.push({
    type: "modification",
    section: "Structure",
    description: "Diversified sentence structures for a more natural, human-written feel",
  })

  // 8. Enhance skills section with missing keywords
  if (sections.skills) {
    optimizedText = enhanceSkillsSection(optimizedText, sections.skills, missingKeywords)
    changes.push({
      type: "modification",
      section: "Skills",
      description: "Added relevant skills from job description",
    })
  } else {
    // Add a skills section if it doesn't exist
    optimizedText = addSkillsSection(optimizedText, missingKeywords)
    changes.push({
      type: "addition",
      section: "Skills",
      description: "Added skills section with relevant keywords from job description",
    })
  }

  return { optimizedText, changes }
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

// Enhance the summary section for job fit
function enhanceSummaryForJobFit(
  resumeText: string,
  section: { start: number; end: number },
  jobDescription: string,
  missingKeywords: string[],
): string {
  const lines = resumeText.split("\n")
  const summaryLines = lines.slice(section.start, section.end + 1)

  // Extract the summary content (skip the header)
  const summaryContent = summaryLines.slice(1).join(" ").trim()

  // Extract key requirements from job description
  const jobRequirements = extractKeyRequirements(jobDescription)

  // Create an enhanced summary that aligns with job requirements
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

    // Add a sentence about alignment with job requirements if we have them
    if (jobRequirements.length > 0) {
      const topRequirements = jobRequirements.slice(0, 3)
      const requirementsPhrase = topRequirements.join(", ")

      // Check if summary ends with a period
      const endsWithPeriod = enhancedSummary.trim().endsWith(".")

      enhancedSummary =
        enhancedSummary.trim() +
        (endsWithPeriod ? " " : ". ") +
        `Seeking to leverage skills in ${requirementsPhrase} to deliver exceptional results.`
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

// Extract key requirements from job description
function extractKeyRequirements(jobDescription: string): string[] {
  // Look for common requirement patterns
  const requirementPatterns = [
    /requirements?:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is,
    /qualifications?:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is,
    /skills?:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is,
    /we are looking for:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is,
    /what you'll need:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is,
  ]

  let requirementsText = ""

  // Try to extract requirements section
  for (const pattern of requirementPatterns) {
    const match = jobDescription.match(pattern)
    if (match && match[1]) {
      requirementsText = match[1]
      break
    }
  }

  // If we couldn't find a specific section, use the whole job description
  if (!requirementsText) {
    requirementsText = jobDescription
  }

  // Look for bullet points or numbered lists
  const bulletPoints: string[] = []
  const bulletRegex = /[•\-*]\s*(.*?)(?:\n|$)/g
  const numberedRegex = /\d+\.\s*(.*?)(?:\n|$)/g

  let match
  while ((match = bulletRegex.exec(requirementsText)) !== null) {
    if (match[1].trim().length > 0) {
      bulletPoints.push(match[1].trim())
    }
  }

  while ((match = numberedRegex.exec(requirementsText)) !== null) {
    if (match[1].trim().length > 0) {
      bulletPoints.push(match[1].trim())
    }
  }

  // If we found bullet points, use those
  if (bulletPoints.length > 0) {
    return bulletPoints
  }

  // Otherwise, try to extract key phrases
  const phrases = requirementsText
    .split(/[.;:]/)
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length > 10 && phrase.length < 100)

  return phrases.slice(0, 5)
}

// Optimize resume for ATS
function optimizeForATS(resumeText: string, jobDescription: string, missingKeywords: string[]): string {
  let optimizedText = resumeText

  // 1. Ensure proper section headers
  optimizedText = ensureProperSectionHeaders(optimizedText)

  // 2. Add missing keywords in appropriate sections
  optimizedText = addMissingKeywords(optimizedText, missingKeywords)

  // 3. Standardize formatting
  optimizedText = standardizeFormatting(optimizedText)

  // 4. Remove special characters that might confuse ATS
  optimizedText = removeSpecialCharacters(optimizedText)

  return optimizedText
}

// Ensure proper section headers for ATS
function ensureProperSectionHeaders(text: string): string {
  const lines = text.split("\n")
  const standardHeaders = {
    summary: ["professional summary", "profile", "about me"],
    experience: ["work experience", "employment history", "work history", "professional experience"],
    skills: ["technical skills", "core competencies", "key skills", "expertise"],
    education: ["academic background", "educational background"],
    projects: ["key projects", "relevant projects"],
    certifications: ["certificates", "professional certifications"],
  }

  // Check if standard headers exist
  const foundHeaders = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase()

    for (const [standard, variations] of Object.entries(standardHeaders)) {
      if (line === standard || variations.includes(line)) {
        foundHeaders.add(standard)

        // Standardize the header format (all caps)  {
        foundHeaders.add(standard)

        // Standardize the header format (all caps)
        lines[i] = standard.toUpperCase()
        break
      }
    }
  }

  // Add missing essential headers if needed
  const essentialHeaders = ["EXPERIENCE", "EDUCATION", "SKILLS"]
  const modifiedLines = [...lines]

  for (const header of essentialHeaders) {
    if (!foundHeaders.has(header.toLowerCase())) {
      // Find a good place to insert the missing header
      // Typically at the end of the resume
      modifiedLines.push("", header)
    }
  }

  return modifiedLines.join("\n")
}

// Add missing keywords in appropriate sections
function addMissingKeywords(text: string, missingKeywords: string[]): string {
  if (missingKeywords.length === 0) return text

  const sections = identifyResumeSections(text)
  const lines = text.split("\n")

  // Group keywords by likely section
  const keywordsBySection: Record<string, string[]> = {
    skills: [],
    experience: [],
    summary: [],
    education: [],
    projects: [],
  }

  // Categorize keywords
  missingKeywords.forEach((keyword) => {
    if (/\b(language|framework|tool|software|technology|programming|database|cloud|platform)\b/i.test(keyword)) {
      keywordsBySection.skills.push(keyword)
    } else if (/\b(degree|university|college|education|gpa|graduate|certification)\b/i.test(keyword)) {
      keywordsBySection.education.push(keyword)
    } else if (/\b(led|managed|developed|implemented|created|designed|analyzed|improved)\b/i.test(keyword)) {
      keywordsBySection.experience.push(keyword)
    } else {
      // Default to skills for uncategorized keywords
      keywordsBySection.skills.push(keyword)
    }
  })

  // Add keywords to appropriate sections
  for (const [sectionName, keywords] of Object.entries(keywordsBySection)) {
    if (keywords.length === 0) continue

    const section = sections[sectionName]
    if (section) {
      // Add to existing section
      if (sectionName === "skills") {
        // For skills section, add as bullet points or comma-separated list
        const skillsText = `• ${keywords.join("\n• ")}`
        lines.splice(section.end + 1, 0, skillsText)
      } else if (sectionName === "experience") {
        // For experience, try to integrate into existing bullet points
        // This is a simplified approach - in a real implementation, we would
        // analyze each bullet point and integrate keywords more naturally
        const experienceLines = lines.slice(section.start, section.end + 1)
        let bulletPointFound = false

        for (let i = 0; i < experienceLines.length; i++) {
          if (
            experienceLines[i].trim().startsWith("•") ||
            experienceLines[i].trim().startsWith("-") ||
            experienceLines[i].trim().startsWith("*")
          ) {
            bulletPointFound = true
            break
          }
        }

        if (bulletPointFound) {
          // Add keywords to existing bullet points
          // This is a placeholder - in a real implementation, we would
          // integrate keywords more naturally
        } else {
          // Add as new bullet points
          const bulletPoints = keywords.map((keyword) => `• Demonstrated expertise in ${keyword}`)
          lines.splice(section.end + 1, 0, ...bulletPoints)
        }
      }
    }
  }

  return lines.join("\n")
}

// Standardize formatting for ATS
function standardizeFormatting(text: string): string {
  // 1. Standardize bullet points
  let standardized = text.replace(/[•\-*]\s*/g, "• ")

  // 2. Ensure consistent spacing
  standardized = standardized.replace(/\n{3,}/g, "\n\n")

  // 3. Standardize date formats (MM/YYYY or MM/YYYY - MM/YYYY)
  const dateRegex = /\b(0?[1-9]|1[0-2])\/\d{4}\b/g
  const dateRangeRegex = /\b(0?[1-9]|1[0-2])\/\d{4}\s*[-–—]\s*(0?[1-9]|1[0-2])\/\d{4}\b/g

  // This is a simplified approach - in a real implementation, we would
  // handle more date formats and standardize them more thoroughly

  return standardized
}

// Remove special characters that might confuse ATS
function removeSpecialCharacters(text: string): string {
  // Remove special characters that might confuse ATS
  // but keep basic formatting like bullets and dashes
  return text
    .replace(/[""'']/g, '"') // Standardize quotes
    .replace(/[–—]/g, "-") // Standardize dashes
    .replace(/[®©™]/g, "") // Remove trademark symbols
    .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
}

// Enhance experience section naturally
function enhanceExperienceNaturally(
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
      "built",
      "launched",
      "coordinated",
      "established",
      "executed",
      "generated",
      "initiated",
      "maintained",
      "optimized",
      "produced",
      "streamlined",
      "transformed",
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
      .replace(/due to the fact that/gi, "because")
      .replace(/a large number of/gi, "many")
      .replace(/a majority of/gi, "most")
      .replace(/at this point in time/gi, "now")
      .replace(/for the purpose of/gi, "for")

    // Add a relevant keyword if possible and natural
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

// Remove redundant phrasing
function removeRedundantPhrasing(text: string): string {
  // Common redundant phrases and their replacements
  const redundantPhrases: [RegExp, string][] = [
    [/in order to/gi, "to"],
    [/due to the fact that/gi, "because"],
    [/for the purpose of/gi, "for"],
    [/in the event that/gi, "if"],
    [/in the process of/gi, "while"],
    [/on a regular basis/gi, "regularly"],
    [/at this point in time/gi, "now"],
    [/in the near future/gi, "soon"],
    [/a large number of/gi, "many"],
    [/a majority of/gi, "most"],
    [/a sufficient amount of/gi, "enough"],
    [/in spite of the fact that/gi, "although"],
    [/with reference to/gi, "regarding"],
    [/with the exception of/gi, "except for"],
    [/in the vicinity of/gi, "near"],
    [/for the reason that/gi, "because"],
    [/in a timely manner/gi, "promptly"],
    [/in an effort to/gi, "to"],
    [/in the field of/gi, "in"],
    [/in the area of/gi, "in"],
  ]

  let optimizedText = text

  // Replace redundant phrases
  redundantPhrases.forEach(([pattern, replacement]) => {
    optimizedText = optimizedText.replace(pattern, replacement)
  })

  return optimizedText
}

// Make language more natural
function makeLanguageMoreNatural(text: string): string {
  // Common formal/stiff phrases and their natural alternatives
  const formalPhrases: [RegExp, string][] = [
    [/utilize/gi, "use"],
    [/implement/gi, "build"],
    [/facilitate/gi, "help"],
    [/leverage/gi, "use"],
    [/optimize/gi, "improve"],
    [/endeavor/gi, "try"],
    [/commence/gi, "begin"],
    [/terminate/gi, "end"],
    [/ascertain/gi, "find out"],
    [/subsequently/gi, "then"],
    [/additionally/gi, "also"],
    [/furthermore/gi, "also"],
    [/moreover/gi, "also"],
    [/nevertheless/gi, "however"],
    [/regarding/gi, "about"],
    [/concerning/gi, "about"],
    [/pertaining to/gi, "about"],
    [/in regards to/gi, "about"],
    [/with regards to/gi, "about"],
    [/prior to/gi, "before"],
    [/subsequent to/gi, "after"],
    [/in conjunction with/gi, "with"],
    [/in accordance with/gi, "following"],
    [/in the absence of/gi, "without"],
    [/in the presence of/gi, "with"],
    [/in close proximity to/gi, "near"],
    [/at the present time/gi, "now"],
    [/at this juncture/gi, "now"],
    [/in the not too distant future/gi, "soon"],
    [/in the foreseeable future/gi, "soon"],
  ]

  let naturalText = text

  // Replace formal phrases with natural alternatives
  formalPhrases.forEach(([pattern, replacement]) => {
    naturalText = naturalText.replace(pattern, replacement)
  })

  return naturalText
}

// Replace generic phrases with compelling language
function replaceGenericPhrases(text: string): string {
  // Common generic phrases and their compelling alternatives
  const genericPhrases: [RegExp, string][] = [
    [/responsible for/gi, "led"],
    [/duties included/gi, "achieved"],
    [/worked on/gi, "developed"],
    [/helped with/gi, "contributed to"],
    [/assisted with/gi, "supported"],
    [/was involved in/gi, "drove"],
    [/participated in/gi, "collaborated on"],
    [/good communication skills/gi, "effectively communicated complex ideas"],
    [/team player/gi, "collaborated effectively in cross-functional teams"],
    [/detail-oriented/gi, "meticulously managed project details"],
    [/problem solver/gi, "resolved complex challenges"],
    [/hard worker/gi, "consistently delivered results under tight deadlines"],
    [/quick learner/gi, "rapidly adapted to new technologies"],
    [/strong work ethic/gi, "demonstrated commitment through consistent high-quality work"],
    [/go-getter/gi, "proactively identified and solved problems"],
    [/think outside the box/gi, "developed innovative solutions"],
    [/results-oriented/gi, "achieved measurable outcomes"],
    [/bottom line/gi, "key results"],
    [/hit the ground running/gi, "quickly became productive"],
    [/gave 110 percent/gi, "exceeded expectations"],
  ]

  let compellingText = text

  // Replace generic phrases with compelling alternatives
  genericPhrases.forEach(([pattern, replacement]) => {
    compellingText = compellingText.replace(pattern, replacement)
  })

  return compellingText
}

// Diversify sentence structures for natural flow
function diversifySentenceStructures(text: string): string {
  // This is a simplified implementation - in a real AI system,
  // we would use more sophisticated NLP techniques to analyze and
  // restructure sentences while preserving meaning

  // For now, we'll focus on bullet points, which are the most common
  // elements in resumes that need diversification

  const lines = text.split("\n")
  const bulletPointIndices: number[] = []

  // Find bullet points
  lines.forEach((line, index) => {
    if (line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*")) {
      bulletPointIndices.push(index)
    }
  })

  // If we have multiple bullet points, try to diversify their structure
  if (bulletPointIndices.length > 3) {
    // Identify bullet points that start with the same verb
    const startingVerbs: Record<string, number[]> = {}

    bulletPointIndices.forEach((index) => {
      const line = lines[index]
      const content = line.replace(/^[•\-*]\s*/, "")
      const firstWord = content
        .split(" ")[0]
        .toLowerCase()
        .replace(/[,.;:]/, "")

      if (!startingVerbs[firstWord]) {
        startingVerbs[firstWord] = []
      }

      startingVerbs[firstWord].push(index)
    })

    // For verbs that are used multiple times, diversify some of them
    for (const [verb, indices] of Object.entries(startingVerbs)) {
      if (indices.length > 1) {
        // Modify all but the first occurrence
        for (let i = 1; i < indices.length; i++) {
          const index = indices[i]
          const line = lines[index]
          const content = line.replace(/^([•\-*]\s*)/, "")

          // Different restructuring techniques
          if (i % 3 === 1) {
            // Technique 1: Start with "Successfully..." or similar
            const enhancers = ["Successfully", "Effectively", "Proactively", "Strategically"]
            const enhancer = enhancers[Math.floor(Math.random() * enhancers.length)]
            lines[index] = line.replace(/^([•\-*]\s*).*/, `$1${enhancer} ${content}`)
          } else if (i % 3 === 2) {
            // Technique 2: Restructure to start with a result
            // This is a simplified approach - in a real implementation,
            // we would use more sophisticated NLP techniques
            if (content.includes("resulting in") || content.includes("which led to")) {
              // Extract the result and move it to the front
              const resultMatch = content.match(/(resulting in|which led to) (.*?)([,.;]|$)/i)
              if (resultMatch && resultMatch[2]) {
                const result = resultMatch[2]
                const action = content.replace(/(resulting in|which led to) (.*?)([,.;]|$)/i, "").trim()
                lines[index] = line.replace(/^([•\-*]\s*).*/, `$1Achieved ${result} by ${action}`)
              }
            }
          }
          // For i % 3 === 0, we leave the structure as is
        }
      }
    }
  }

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

// Calculate match score
function calculateMatchScore(matchedKeywords: number, totalKeywords: number): number {
  if (totalKeywords === 0) return 75 // Default score if no keywords

  // Base score on keyword matches
  const baseScore = Math.round((matchedKeywords / totalKeywords) * 100)

  // Ensure score is between 50-95
  return Math.min(Math.max(baseScore, 50), 95)
}

// Calculate fit rating out of 10
function calculateFitRating(
  resumeText: string,
  jobDescription: string,
  matchedKeywords: string[],
  allKeywords: string[],
): number {
  // Base rating on keyword match percentage
  const keywordMatchPercentage = allKeywords.length > 0 ? matchedKeywords.length / allKeywords.length : 0.5

  // Extract key requirements from job description
  const requirements = extractKeyRequirements(jobDescription)

  // Calculate requirement match score
  let requirementMatchScore = 0
  if (requirements.length > 0) {
    let matchedRequirements = 0

    requirements.forEach((requirement) => {
      // Check if resume contains this requirement or similar phrases
      const requirementWords = requirement
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 3)
      const matchedWords = requirementWords.filter((word) => resumeText.toLowerCase().includes(word))

      if (matchedWords.length > requirementWords.length * 0.5) {
        matchedRequirements++
      }
    })

    requirementMatchScore = requirements.length > 0 ? matchedRequirements / requirements.length : 0
  }

  // Combine scores (60% keyword match, 40% requirement match)
  const combinedScore = keywordMatchPercentage * 0.6 + requirementMatchScore * 0.4

  // Convert to a 1-10 scale
  const rating = Math.round(combinedScore * 10)

  // Ensure rating is between 1-10
  return Math.min(Math.max(rating, 1), 10)
}

// Generate follow-up questions
function generateFollowupQuestions(originalText: string, jobDescription: string, optimizedText: string): string[] {
  const questions: string[] = []

  // 1. Check for missing experience
  const jobRequirements = extractKeyRequirements(jobDescription)
  const missingExperience = jobRequirements.filter(
    (req) =>
      !originalText.toLowerCase().includes(req.toLowerCase()) &&
      !optimizedText.toLowerCase().includes(req.toLowerCase()),
  )

  if (missingExperience.length > 0) {
    const requirement = missingExperience[0]
    questions.push(`Do you have any experience with ${requirement} that's not mentioned in your resume?`)
  }

  // 2. Check for quantifiable achievements
  if (!/(increased|decreased|reduced|improved|achieved|saved|generated) by \d+%/i.test(optimizedText)) {
    questions.push("Can you provide any specific metrics or percentages for your achievements?")
  }

  // 3. Check for project examples
  if (!/project|initiative/i.test(optimizedText)) {
    questions.push("Do you have any specific projects that demonstrate your skills relevant to this position?")
  }

  // 4. Check for leadership experience
  if (!/led|managed|supervised|directed|oversaw/i.test(optimizedText)) {
    questions.push("Do you have any leadership or team management experience that could be highlighted?")
  }

  // 5. Check for certifications
  if (!/certification|certified|certificate/i.test(optimizedText)) {
    questions.push("Do you have any certifications or specialized training relevant to this role?")
  }

  // Always add these general questions
  questions.push("What specific accomplishment are you most proud of that relates to this job?")
  questions.push("Is there a particular skill or experience that makes you uniquely qualified for this position?")

  // Return up to 5 questions
  return questions.slice(0, 5)
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
    fitRating: 5,
    followupQuestions: [
      "Would you like to try again with a different resume or job description?",
      "Is there a specific aspect of your resume you'd like to improve?",
    ],
  }
}
