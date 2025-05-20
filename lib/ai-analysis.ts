import { getXaiClient } from "@/lib/xai-client"
import type { OptimizationOptions } from "@/components/optimization-settings"
import type { OptimizationResult } from "@/components/resume-optimizer"

type OptimizeResumeRequest = {
  resumeText: string
  jobDescription?: string
  keywords?: string[]
  options: OptimizationOptions
}

// Export the analyzeResumeWithAI function to fix deployment error
export async function analyzeResumeWithAI(request: OptimizeResumeRequest): Promise<OptimizationResult> {
  const { resumeText, jobDescription, keywords = [], options } = request

  try {
    // Initialize Grok AI client
    const xai = getXaiClient()

    if (!xai) {
      throw new Error("Failed to initialize AI client")
    }

    console.log("Sending resume analysis request to AI...")

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
          content: buildAnalysisPrompt(resumeText, jobDescription || "", keywords, options),
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
    const aiResponse = response.choices[0].message.content

    if (!aiResponse) {
      throw new Error("Empty response from AI model")
    }

    // Parse the AI response to extract the optimization result
    return parseAIResponse(aiResponse, resumeText, jobDescription || "", keywords)
  } catch (error) {
    console.error("Error in AI analysis:", error)

    // Return fallback result
    return generateFallbackResult(resumeText, jobDescription || "", keywords)
  }
}

// Build the prompt for the AI
function buildAnalysisPrompt(
  resumeText: string,
  jobDescription: string,
  keywords: string[],
  options: OptimizationOptions,
): string {
  return `
I need you to analyze and optimize the following resume for the job description provided.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription || "No job description provided. Please optimize based on the keywords."}

IMPORTANT KEYWORDS TO INCLUDE:
${keywords.join(", ")}

OPTIMIZATION SETTINGS:
- Detail Level: ${options.detailLevel}
- Priority Sections: ${options.prioritySections.join(", ")}
- Preserve Formatting: ${options.preserveFormatting ? "Yes" : "No"}
- Keyword Density: ${options.keywordDensity}

INSTRUCTIONS:
1. Analyze the resume and identify strengths and weaknesses
2. Optimize the resume to better match the job description
3. Incorporate the keywords naturally where appropriate
4. Focus on the priority sections while still improving others
5. Return the optimized resume and analysis in the following JSON format:

{
  "optimizedText": "The full optimized resume text",
  "changes": [
    {
      "type": "addition|modification|removal",
      "section": "Section name",
      "description": "Description of the change"
    }
  ],
  "keywords": {
    "matched": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"]
  },
  "score": 85,
  "fitRating": 8,
  "followupQuestions": [
    "Question 1?",
    "Question 2?",
    "Question 3?"
  ]
}
`
}

// Parse the AI response
function parseAIResponse(
  aiResponse: string,
  originalText: string,
  jobDescription: string,
  keywords: string[],
): OptimizationResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const jsonStr = jsonMatch[0]
      const result = JSON.parse(jsonStr)

      return {
        originalText,
        optimizedText: result.optimizedText || originalText,
        changes: result.changes || [],
        keywords: result.keywords || { matched: [], missing: [] },
        score: result.score || 75,
        fitRating: result.fitRating || 7,
        followupQuestions: result.followupQuestions || [],
        jobDescription,
      }
    }

    throw new Error("Could not parse AI response as JSON")
  } catch (error) {
    console.error("Error parsing AI response:", error)
    return generateFallbackResult(originalText, jobDescription, keywords)
  }
}

// Generate a fallback result when AI fails
function generateFallbackResult(resumeText: string, jobDescription: string, keywords: string[]): OptimizationResult {
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
  const changes = [
    {
      type: "addition",
      section: "Skills",
      description: `Consider adding these missing keywords: ${missingKeywords.join(", ")}`,
    },
    {
      type: "modification",
      section: "Experience",
      description: "Enhance your experience descriptions with more specific achievements and metrics",
    },
    {
      type: "modification",
      section: "Summary",
      description: "Update your summary to better align with the target position",
    },
  ]

  return {
    originalText: resumeText,
    optimizedText: resumeText, // In fallback mode, we don't modify the text
    changes,
    keywords: {
      matched: matchedKeywords,
      missing: missingKeywords,
    },
    score,
    fitRating: calculateFitRating(score),
    followupQuestions: [
      "Would you like to add the missing keywords to your resume?",
      "Do you want to enhance your experience descriptions with more achievements?",
      "Should we update your summary to better match the job description?",
    ],
    jobDescription,
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

// Calculate a fit rating (1-10) based on the score
function calculateFitRating(score: number): number {
  return Math.max(1, Math.min(10, Math.round(score / 10)))
}
