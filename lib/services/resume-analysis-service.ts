/**
 * Resume Analysis Service
 * Handles all resume analysis and optimization with robust error handling
 */
import { getXaiClient } from "../xai-client"
import type { OptimizationOptions } from "@/components/optimization-settings"
import type { OptimizationResult } from "@/components/resume-optimizer"

export interface AnalysisRequest {
  resumeText: string
  jobDescription?: string
  keywords?: string[]
  options: OptimizationOptions
}

export interface AnalysisResponse {
  success: boolean
  result?: OptimizationResult
  error?: {
    message: string
    code: string
    details?: any
  }
  metadata?: {
    processingTime: number
    modelUsed: string
    promptTokens?: number
    completionTokens?: number
  }
}

export class ResumeAnalysisService {
  /**
   * Analyze resume and generate optimization suggestions
   */
  public async analyzeResume(request: AnalysisRequest): Promise<AnalysisResponse> {
    const startTime = performance.now()

    try {
      console.log("Starting resume analysis with options:", request.options)

      // Validate inputs
      this.validateInputs(request)

      // Initialize AI client
      const xai = getXaiClient()
      if (!xai) {
        throw new Error("Failed to initialize AI client")
      }

      // Extract keywords from job description if not provided
      const keywords =
        request.keywords && request.keywords.length > 0
          ? request.keywords
          : this.extractKeywordsFromText(request.jobDescription || "")

      // Build the analysis prompt
      const prompt = this.buildAnalysisPrompt(
        request.resumeText,
        request.jobDescription || "",
        keywords,
        request.options,
      )

      console.log("Sending analysis request to AI model")

      // Call the AI model with timeout handling
      const aiResponse = await this.callAIWithTimeout(xai, prompt)

      if (!aiResponse.choices || aiResponse.choices.length === 0) {
        throw new Error("No response from AI model")
      }

      // Parse the AI response
      const responseContent = aiResponse.choices[0].message.content
      if (!responseContent) {
        throw new Error("Empty response from AI model")
      }

      // Parse the response to extract the optimization result
      const result = this.parseAIResponse(responseContent, request.resumeText, request.jobDescription || "", keywords)

      const processingTime = performance.now() - startTime

      return {
        success: true,
        result,
        metadata: {
          processingTime,
          modelUsed: "grok-1",
          promptTokens: aiResponse.usage?.prompt_tokens,
          completionTokens: aiResponse.usage?.completion_tokens,
        },
      }
    } catch (error) {
      const processingTime = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      console.error("Resume analysis failed:", error)

      // Generate fallback result if AI analysis fails
      const fallbackResult = this.generateFallbackResult(
        request.resumeText,
        request.jobDescription || "",
        request.keywords || [],
      )

      return {
        success: false,
        result: fallbackResult,
        error: {
          message: errorMessage,
          code: this.getErrorCode(error),
          details: error,
        },
        metadata: {
          processingTime,
          modelUsed: "fallback",
        },
      }
    }
  }

  /**
   * Validate analysis inputs
   */
  private validateInputs(request: AnalysisRequest): void {
    if (!request.resumeText || request.resumeText.trim().length < 100) {
      throw new Error("Resume text is too short or empty")
    }

    if (!request.jobDescription && (!request.keywords || request.keywords.length === 0)) {
      throw new Error("Either job description or keywords are required")
    }

    if (request.resumeText.length > 50000) {
      throw new Error("Resume text exceeds maximum length (50,000 characters)")
    }

    if (request.jobDescription && request.jobDescription.length > 10000) {
      throw new Error("Job description exceeds maximum length (10,000 characters)")
    }
  }

  /**
   * Call AI model with timeout handling
   */
  private async callAIWithTimeout(xai: any, prompt: string, timeoutMs = 30000): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        reject(new Error("AI request timed out after " + timeoutMs + "ms"))
      }, timeoutMs)

      try {
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

        // Clear timeout and resolve
        clearTimeout(timeoutId)
        resolve(response)
      } catch (error) {
        // Clear timeout and reject
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  /**
   * Build the prompt for the AI
   */
  private buildAnalysisPrompt(
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

  /**
   * Parse the AI response
   */
  private parseAIResponse(
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
      return this.generateFallbackResult(originalText, jobDescription, keywords)
    }
  }

  /**
   * Generate a fallback result when AI fails
   */
  private generateFallbackResult(resumeText: string, jobDescription: string, keywords: string[]): OptimizationResult {
    // Extract keywords from job description if no keywords provided
    const extractedKeywords = keywords.length > 0 ? keywords : this.extractKeywordsFromText(jobDescription)

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
        type: "addition" as const,
        section: "Skills",
        description: `Consider adding these missing keywords: ${missingKeywords.join(", ")}`,
      },
      {
        type: "modification" as const,
        section: "Experience",
        description: "Enhance your experience descriptions with more specific achievements and metrics",
      },
      {
        type: "modification" as const,
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
      fitRating: Math.max(1, Math.min(10, Math.round(score / 10))),
      followupQuestions: [
        "Would you like to add the missing keywords to your resume?",
        "Do you want to enhance your experience descriptions with more achievements?",
        "Should we update your summary to better match the job description?",
      ],
      jobDescription,
    }
  }

  /**
   * Extract keywords from text
   */
  private extractKeywordsFromText(text: string): string[] {
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

  /**
   * Get standardized error code from error
   */
  private getErrorCode(error: any): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      if (message.includes("timeout")) return "TIMEOUT_ERROR"
      if (message.includes("parse")) return "PARSING_ERROR"
      if (message.includes("empty")) return "EMPTY_RESPONSE_ERROR"
      if (message.includes("token")) return "TOKEN_LIMIT_ERROR"
      if (message.includes("rate")) return "RATE_LIMIT_ERROR"
      if (message.includes("initialize")) return "INITIALIZATION_ERROR"
    }

    return "UNKNOWN_ERROR"
  }
}

// Export singleton instance
export const resumeAnalysisService = new ResumeAnalysisService()
