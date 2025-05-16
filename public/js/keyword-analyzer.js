/**
 * Keyword Analyzer for Resume Optimizer
 * Analyzes resume text against job description to find keyword matches
 */

;(() => {
  /**
   * Analyzes a resume against a job description to find keyword matches
   * @param {string} resumeText - The resume text
   * @param {string} jobDescription - The job description
   * @param {Array<string>} additionalKeywords - Additional keywords to consider
   * @returns {Object} - Analysis results
   */
  function analyzeKeywordMatch(resumeText, jobDescription, additionalKeywords = []) {
    if (!resumeText || !jobDescription) {
      throw new Error("Resume text and job description are required")
    }

    console.log("Analyzing resume against job description")

    // Extract keywords from job description
    const jobKeywords = extractKeywords(jobDescription)

    // Add additional keywords
    if (additionalKeywords && additionalKeywords.length > 0) {
      additionalKeywords.forEach((keyword) => {
        if (!jobKeywords.includes(keyword.toLowerCase())) {
          jobKeywords.push(keyword.toLowerCase())
        }
      })
    }

    // Find matching keywords in resume
    const matchingKeywords = []
    const missingKeywords = []

    jobKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "gi")
      const matches = resumeText.match(regex)

      if (matches && matches.length > 0) {
        matchingKeywords.push({
          text: keyword,
          frequency: matches.length,
        })
      } else {
        missingKeywords.push(keyword)
      }
    })

    // Calculate match score (percentage of keywords found)
    const score = Math.round((matchingKeywords.length / jobKeywords.length) * 100)

    // Generate suggestions based on analysis
    const suggestions = generateSuggestions(matchingKeywords, missingKeywords, resumeText)

    return {
      score,
      matchingKeywords,
      missingKeywords,
      suggestions,
    }
  }

  /**
   * Extracts keywords from text
   * @param {string} text - The text to extract keywords from
   * @returns {Array<string>} - Array of keywords
   */
  function extractKeywords(text) {
    if (!text) return []

    // Convert to lowercase
    const lowercaseText = text.toLowerCase()

    // Remove special characters and split into words
    const words = lowercaseText
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2) // Filter out short words

    // Remove common words
    const commonWords = [
      "the",
      "and",
      "that",
      "have",
      "for",
      "not",
      "with",
      "you",
      "this",
      "but",
      "his",
      "her",
      "she",
      "they",
      "will",
      "from",
      "more",
      "about",
      "what",
      "who",
      "when",
      "where",
      "why",
      "how",
      "all",
      "any",
      "both",
      "each",
      "few",
      "many",
      "some",
      "such",
      "than",
      "then",
      "too",
      "very",
      "can",
      "just",
      "should",
      "now",
    ]

    const filteredWords = words.filter((word) => !commonWords.includes(word))

    // Count word frequency
    const wordCounts = {}
    filteredWords.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    })

    // Get unique words sorted by frequency
    const uniqueWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a])

    // Return top keywords (limit to 30)
    return uniqueWords.slice(0, 30)
  }

  /**
   * Escapes special characters in a string for use in a regular expression
   * @param {string} string - The string to escape
   * @returns {string} - The escaped string
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  /**
   * Generates suggestions based on analysis
   * @param {Array<Object>} matchingKeywords - Matching keywords
   * @param {Array<string>} missingKeywords - Missing keywords
   * @param {string} resumeText - The resume text
   * @returns {Array<string>} - Suggestions
   */
  function generateSuggestions(matchingKeywords, missingKeywords, resumeText) {
    const suggestions = []

    // Suggest adding missing keywords
    if (missingKeywords.length > 0) {
      suggestions.push(
        `Add these missing keywords to your resume: ${missingKeywords.slice(0, 5).join(", ")}${missingKeywords.length > 5 ? "..." : ""}`,
      )
    }

    // Suggest improving sections
    const sections = ["summary", "experience", "skills", "education", "projects"]
    const missingSections = sections.filter((section) => !resumeText.toLowerCase().includes(section))

    if (missingSections.length > 0) {
      suggestions.push(`Add these missing sections to your resume: ${missingSections.join(", ")}`)
    }

    // Suggest using bullet points
    if (!resumeText.includes("•") && !resumeText.includes("-")) {
      suggestions.push("Use bullet points to highlight your achievements and responsibilities")
    }

    // Suggest quantifying achievements
    if (!(/\d+%/.test(resumeText) || /\$\d+/.test(resumeText))) {
      suggestions.push("Quantify your achievements with numbers and percentages")
    }

    // Suggest using action verbs
    const actionVerbs = [
      "achieved",
      "improved",
      "increased",
      "reduced",
      "managed",
      "developed",
      "created",
      "implemented",
    ]
    const usedActionVerbs = actionVerbs.filter((verb) => resumeText.toLowerCase().includes(verb))

    if (usedActionVerbs.length < 3) {
      suggestions.push("Use more powerful action verbs to describe your experience")
    }

    return suggestions
  }

  // Expose function to global scope
  window.analyzeKeywordMatch = analyzeKeywordMatch
})()
