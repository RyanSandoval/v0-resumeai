/**
 * Keyword analysis utility for resume optimization
 */

;(() => {
  /**
   * Analyzes keyword matches between resume and job description
   * @param {string} resumeText - The text content of the resume
   * @param {string} jobDescription - The job description text
   * @param {Array<string>} additionalKeywords - Optional additional keywords to consider
   * @returns {Object} - Analysis results including score, matching keywords, missing keywords, and suggestions
   */
  function analyzeKeywordMatch(resumeText, jobDescription, additionalKeywords = []) {
    // Normalize text for better matching
    const normalizedResumeText = normalizeText(resumeText)
    const normalizedJobDescription = normalizeText(jobDescription)

    // Extract keywords from job description
    const jobKeywords = extractKeywords(normalizedJobDescription)

    // Add any additional keywords provided
    additionalKeywords.forEach((keyword) => {
      if (!jobKeywords.includes(normalizeText(keyword))) {
        jobKeywords.push(normalizeText(keyword))
      }
    })

    // Find matching and missing keywords
    const matchingKeywords = []
    const missingKeywords = []

    jobKeywords.forEach((keyword) => {
      // Check if keyword is in resume
      const regex = new RegExp(`\\b${keyword}\\b`, "gi")
      const matches = normalizedResumeText.match(regex)

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
    const suggestions = generateSuggestions(matchingKeywords, missingKeywords, score)

    return {
      score,
      matchingKeywords,
      missingKeywords,
      suggestions,
    }
  }

  /**
   * Normalizes text for better keyword matching
   */
  function normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .trim()
  }

  /**
   * Extracts important keywords from text
   */
  function extractKeywords(text) {
    // Split text into words
    const words = text.split(/\s+/)

    // Filter out common stop words and short words
    const filteredWords = words.filter((word) => {
      return word.length > 3 && !STOP_WORDS.includes(word)
    })

    // Count word frequency
    const wordCounts = {}
    filteredWords.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    })

    // Extract multi-word phrases (2-3 words)
    const phrases = extractPhrases(text, 2, 3)

    // Combine single words and phrases, prioritizing by frequency
    const combinedKeywords = [...Object.keys(wordCounts), ...phrases]

    // Remove duplicates and limit to top keywords
    const uniqueKeywords = [...new Set(combinedKeywords)]

    // Sort by length (prefer longer keywords) and limit to reasonable number
    return uniqueKeywords.sort((a, b) => b.length - a.length).slice(0, 30)
  }

  /**
   * Extracts multi-word phrases from text
   */
  function extractPhrases(text, minWords, maxWords) {
    const words = text.split(/\s+/)
    const phrases = []

    for (let i = 0; i < words.length; i++) {
      for (let j = minWords; j <= maxWords && i + j <= words.length; j++) {
        const phrase = words.slice(i, i + j).join(" ")

        // Check if phrase contains only stop words
        const phraseWords = phrase.split(" ")
        const hasNonStopWord = phraseWords.some((word) => !STOP_WORDS.includes(word) && word.length > 3)

        if (hasNonStopWord && phrase.length > 8) {
          phrases.push(phrase)
        }
      }
    }

    return phrases
  }

  /**
   * Generates improvement suggestions based on analysis
   */
  function generateSuggestions(matchingKeywords, missingKeywords, score) {
    const suggestions = []

    // Suggestions based on score
    if (score < 30) {
      suggestions.push(
        "Your resume has very low keyword match with this job description. Consider a significant revision to include more relevant skills and experience.",
      )
    } else if (score < 60) {
      suggestions.push(
        "Your resume has moderate keyword match. Adding more relevant keywords would improve your chances.",
      )
    } else if (score < 80) {
      suggestions.push("Your resume has good keyword match, but there's room for improvement.")
    } else {
      suggestions.push("Your resume has excellent keyword match with this job description!")
    }

    // Suggestions for missing keywords
    if (missingKeywords.length > 0) {
      const topMissingKeywords = missingKeywords.slice(0, 5)
      suggestions.push(`Consider adding these important keywords to your resume: ${topMissingKeywords.join(", ")}.`)
    }

    // Suggestions for keyword frequency
    const lowFrequencyKeywords = matchingKeywords.filter((k) => k.frequency === 1).map((k) => k.text)

    if (lowFrequencyKeywords.length > 3) {
      suggestions.push(
        `Try to emphasize these keywords more in your resume: ${lowFrequencyKeywords.slice(0, 3).join(", ")}.`,
      )
    }

    // General suggestions
    suggestions.push("Ensure your resume is tailored specifically to this job description.")
    suggestions.push("Use industry-standard terminology that ATS systems can easily recognize.")

    return suggestions
  }

  /**
   * Highlights keywords in text
   * @param {string} text - The text to highlight keywords in
   * @param {Array<string>} keywords - The keywords to highlight
   * @returns {string} - HTML with highlighted keywords
   */
  function highlightKeywords(text, keywords) {
    let highlightedText = text

    // Escape HTML special characters
    highlightedText = highlightedText
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
   * Escapes special characters in string for use in regex
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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

  // Expose functions to the global scope
  window.analyzeKeywordMatch = analyzeKeywordMatch
  window.highlightKeywords = highlightKeywords
  window.createOptimizedPDF = createOptimizedPDF
})()
