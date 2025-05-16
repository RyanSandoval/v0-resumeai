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
    console.log("Starting keyword analysis...")

    if (!resumeText || !jobDescription) {
      console.error("Missing required parameters:", { resumeText: !!resumeText, jobDescription: !!jobDescription })
      throw new Error("Resume text and job description are required")
    }

    try {
      // Extract keywords from job description
      const extractedKeywords = extractKeywords(jobDescription)
      console.log("Extracted keywords from job description:", extractedKeywords)

      // Combine with additional keywords
      const allKeywords = [...new Set([...extractedKeywords, ...additionalKeywords.map((k) => k.toLowerCase())])]
      console.log("All keywords to check:", allKeywords)

      // Find matching and missing keywords
      const matchingKeywords = []
      const missingKeywords = []

      allKeywords.forEach((keyword) => {
        // Create a regex that matches the whole word
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

      console.log("Matching keywords:", matchingKeywords)
      console.log("Missing keywords:", missingKeywords)

      // Calculate match score
      const score = calculateMatchScore(matchingKeywords.length, allKeywords.length)
      console.log("Match score:", score)

      // Generate suggestions
      const suggestions = generateSuggestions(matchingKeywords, missingKeywords, resumeText)
      console.log("Generated suggestions:", suggestions)

      return {
        score,
        matchingKeywords,
        missingKeywords,
        suggestions,
      }
    } catch (error) {
      console.error("Error in keyword analysis:", error)
      throw new Error(`Analysis failed: ${error.message}`)
    }
  }

  /**
   * Extracts keywords from text
   * @param {string} text - The text to extract keywords from
   * @returns {Array<string>} - Array of keywords
   */
  function extractKeywords(text) {
    // Convert to lowercase and remove special characters
    const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, " ")

    // Split into words and filter out short words
    const words = normalizedText.split(/\s+/).filter((word) => word.length > 3)

    // Filter out common stop words
    const filteredWords = words.filter((word) => !STOP_WORDS.includes(word))

    // Count word frequency
    const wordCounts = {}
    filteredWords.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    })

    // Extract phrases (2-3 word combinations)
    const phrases = extractPhrases(normalizedText)

    // Combine single words and phrases, prioritizing by frequency
    const combinedKeywords = [
      ...Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map((entry) => entry[0]),
      ...phrases.slice(0, 10),
    ]

    // Remove duplicates
    return [...new Set(combinedKeywords)]
  }

  /**
   * Extracts multi-word phrases from text
   * @param {string} text - The text to extract phrases from
   * @returns {Array<string>} - Array of phrases
   */
  function extractPhrases(text) {
    const words = text.split(/\s+/)
    const phrases = []
    const phraseCounts = {}

    // Look for 2-3 word phrases
    for (let i = 0; i < words.length - 1; i++) {
      // Two-word phrases
      if (words[i].length > 3 && words[i + 1].length > 3) {
        const phrase = `${words[i]} ${words[i + 1]}`
        phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1
      }

      // Three-word phrases
      if (i < words.length - 2 && words[i].length > 3 && words[i + 1].length > 3 && words[i + 2].length > 3) {
        const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
        phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1
      }
    }

    // Sort phrases by frequency
    return Object.entries(phraseCounts)
      .filter(([phrase, count]) => count > 1) // Only phrases that appear more than once
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])
  }

  /**
   * Calculates match score based on keyword matches
   * @param {number} matchCount - Number of matching keywords
   * @param {number} totalCount - Total number of keywords
   * @returns {number} - Match score (0-100)
   */
  function calculateMatchScore(matchCount, totalCount) {
    if (totalCount === 0) return 0
    return Math.round((matchCount / totalCount) * 100)
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

    // Add missing keywords suggestion
    if (missingKeywords.length > 0) {
      const topMissing = missingKeywords.slice(0, 5)
      suggestions.push(`Add these important keywords to your resume: ${topMissing.join(", ")}`)
    }

    // Check for sections
    const sections = ["summary", "experience", "education", "skills"]
    const missingSections = sections.filter((section) => !resumeText.toLowerCase().includes(section.toLowerCase()))

    if (missingSections.length > 0) {
      suggestions.push(`Add these missing sections to your resume: ${missingSections.join(", ")}`)
    }

    // Check for bullet points
    if (!resumeText.includes("•") && !resumeText.includes("-")) {
      suggestions.push("Use bullet points to highlight your achievements and responsibilities")
    }

    // Check for quantifiable achievements
    if (!(/\d+%/.test(resumeText) || /\$\d+/.test(resumeText) || /\d+ years/.test(resumeText))) {
      suggestions.push("Quantify your achievements with numbers and percentages")
    }

    // Check for action verbs
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

  /**
   * Escapes special characters in a string for use in a regular expression
   * @param {string} string - The string to escape
   * @returns {string} - The escaped string
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  /**
   * Highlights keywords in text
   * @param {string} text - The text to highlight keywords in
   * @param {Array<string>} keywords - The keywords to highlight
   * @returns {string} - HTML with highlighted keywords
   */
  function highlightKeywords(text, keywords) {
    if (!text || !keywords || keywords.length === 0) return text

    // Escape HTML
    let highlightedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")

    // Replace newlines with <br> tags
    highlightedText = highlightedText.replace(/\n/g, "<br>")

    // Highlight each keyword
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "gi")
      highlightedText = highlightedText.replace(regex, (match) => `<span class="highlight">${match}</span>`)
    })

    return highlightedText
  }

  /**
   * Creates an optimized PDF from resume text and analysis
   * @param {string} resumeText - The original resume text
   * @param {Object} analysis - The analysis results
   * @returns {Blob} - A text file blob (placeholder for PDF)
   */
  function createOptimizedPDF(resumeText, analysis) {
    // This is a placeholder implementation
    // In a real implementation, this would generate a proper PDF

    // For now, we'll just return a text file with suggestions
    const content = [
      "OPTIMIZED RESUME",
      "================",
      "",
      `Match Score: ${analysis.score}%`,
      "",
      "SUGGESTIONS:",
      ...analysis.suggestions.map((s) => `- ${s}`),
      "",
      "MISSING KEYWORDS:",
      ...analysis.missingKeywords.map((k) => `- ${k}`),
      "",
      "ORIGINAL RESUME:",
      resumeText,
    ].join("\n")

    return new Blob([content], { type: "text/plain" })
  }

  // Common English stop words to filter out
  const STOP_WORDS = [
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "aren't",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can't",
    "cannot",
    "could",
    "couldn't",
    "did",
    "didn't",
    "do",
    "does",
    "doesn't",
    "doing",
    "don't",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "hadn't",
    "has",
    "hasn't",
    "have",
    "haven't",
    "having",
    "he",
    "he'd",
    "he'll",
    "he's",
    "her",
    "here",
    "here's",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "how's",
    "i",
    "i'd",
    "i'll",
    "i'm",
    "i've",
    "if",
    "in",
    "into",
    "is",
    "isn't",
    "it",
    "it's",
    "its",
    "itself",
    "let's",
    "me",
    "more",
    "most",
    "mustn't",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "ought",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "shan't",
    "she",
    "she'd",
    "she'll",
    "she's",
    "should",
    "shouldn't",
    "so",
    "some",
    "such",
    "than",
    "that",
    "that's",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "there's",
    "these",
    "they",
    "they'd",
    "they'll",
    "they're",
    "they've",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "wasn't",
    "we",
    "we'd",
    "we'll",
    "we're",
    "we've",
    "were",
    "weren't",
    "what",
    "what's",
    "when",
    "when's",
    "where",
    "where's",
    "which",
    "while",
    "who",
    "who's",
    "whom",
    "why",
    "why's",
    "with",
    "won't",
    "would",
    "wouldn't",
    "you",
    "you'd",
    "you'll",
    "you're",
    "you've",
    "your",
    "yours",
    "yourself",
    "yourselves",
  ]

  // Expose functions to global scope
  window.analyzeKeywordMatch = analyzeKeywordMatch
  window.highlightKeywords = highlightKeywords
  window.createOptimizedPDF = createOptimizedPDF
})()
