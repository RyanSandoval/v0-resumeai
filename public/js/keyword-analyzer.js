/**
 * Keyword Analyzer for Resume Optimizer
 */

/**
 * Extracts keywords from text
 * @param {string} text - The text to extract keywords from
 * @returns {Object} - Object containing keywords and their frequencies
 */
function extractKeywords(text) {
  if (!text) return {}

  // Convert to lowercase and remove special characters
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, " ")

  // Split into words
  const words = cleanText.split(/\s+/).filter((word) => word.length > 2)

  // Remove common stop words
  const stopWords = [
    "the",
    "and",
    "or",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "as",
    "of",
    "from",
    "that",
    "this",
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
    "should",
    "could",
    "may",
    "might",
    "must",
    "can",
    "shall",
    "not",
    "then",
    "than",
    "after",
    "before",
    "during",
    "while",
    "until",
    "unless",
    "although",
    "though",
    "even",
    "just",
    "only",
    "very",
    "too",
    "so",
    "also",
  ]

  const filteredWords = words.filter((word) => !stopWords.includes(word))

  // Count word frequencies
  const frequencies = {}
  filteredWords.forEach((word) => {
    frequencies[word] = (frequencies[word] || 0) + 1
  })

  return frequencies
}

/**
 * Extracts phrases (2-3 word combinations)
 * @param {string} text - The text to extract phrases from
 * @returns {Object} - Object containing phrases and their frequencies
 */
function extractPhrases(text) {
  if (!text) return {}

  // Convert to lowercase and remove extra whitespace
  const cleanText = text.toLowerCase().replace(/\s+/g, " ").trim()

  // Get words
  const words = cleanText.split(" ")

  // Generate phrases (2-3 word combinations)
  const phrases = {}

  // Generate 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`
    phrases[phrase] = (phrases[phrase] || 0) + 1
  }

  // Generate 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
    phrases[phrase] = (phrases[phrase] || 0) + 1
  }

  return phrases
}

/**
 * Analyzes the match between a resume and job description
 * @param {string} resumeText - The resume text
 * @param {string} jobDescriptionText - The job description text
 * @param {Array} additionalKeywords - Optional additional keywords to check
 * @returns {Object} - Analysis results
 */
function analyzeKeywordMatch(resumeText, jobDescriptionText, additionalKeywords = []) {
  // Extract keywords from job description
  const jobKeywords = extractKeywords(jobDescriptionText)
  const jobPhrases = extractPhrases(jobDescriptionText)

  // Extract keywords from resume
  const resumeKeywords = extractKeywords(resumeText)
  const resumePhrases = extractPhrases(resumeText)

  // Find matching and missing keywords
  const matchingKeywords = []
  const missingKeywords = []

  // Check for top keywords from job description (sort by frequency)
  const topJobKeywords = Object.entries(jobKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map((entry) => entry[0])

  topJobKeywords.forEach((keyword) => {
    if (resumeKeywords[keyword]) {
      matchingKeywords.push({
        text: keyword,
        frequency: resumeKeywords[keyword],
        type: "keyword",
      })
    } else {
      missingKeywords.push({
        text: keyword,
        importance: jobKeywords[keyword],
        type: "keyword",
      })
    }
  })

  // Check for top phrases from job description
  const topJobPhrases = Object.entries(jobPhrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((entry) => entry[0])

  topJobPhrases.forEach((phrase) => {
    if (resumePhrases[phrase]) {
      matchingKeywords.push({
        text: phrase,
        frequency: resumePhrases[phrase],
        type: "phrase",
      })
    } else {
      missingKeywords.push({
        text: phrase,
        importance: jobPhrases[phrase],
        type: "phrase",
      })
    }
  })

  // Check additional keywords if provided
  additionalKeywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase()
    if (resumeText.toLowerCase().includes(keywordLower)) {
      // Count occurrences
      const regex = new RegExp(`\\b${keywordLower}\\b`, "gi")
      const matches = resumeText.match(regex)
      const frequency = matches ? matches.length : 0

      matchingKeywords.push({
        text: keyword,
        frequency: frequency,
        type: "custom",
      })
    } else {
      missingKeywords.push({
        text: keyword,
        importance: 10, // High importance for custom keywords
        type: "custom",
      })
    }
  })

  // Calculate match score based on matching keywords
  const totalKeywords = topJobKeywords.length + topJobPhrases.length + additionalKeywords.length
  const score = Math.round((matchingKeywords.length / totalKeywords) * 100)

  // Generate suggestions based on missing keywords
  const suggestions = generateSuggestions(missingKeywords, matchingKeywords, resumeText)

  return {
    score,
    matchingKeywords,
    missingKeywords: missingKeywords.map((k) => k.text),
    suggestions,
  }
}

/**
 * Generates optimization suggestions based on analysis
 * @param {Array} missingKeywords - Keywords missing from the resume
 * @param {Array} matchingKeywords - Keywords found in the resume
 * @param {string} resumeText - The resume text
 * @returns {Array} - Array of suggestion strings
 */
function generateSuggestions(missingKeywords, matchingKeywords, resumeText) {
  const suggestions = []

  if (missingKeywords.length > 0) {
    suggestions.push(
      `Add the following important keywords to your resume: ${missingKeywords
        .slice(0, 5)
        .map((k) => k.text)
        .join(", ")}${missingKeywords.length > 5 ? "..." : ""}`,
    )
  }

  // Suggest strengthening weak sections
  const sections = ["experience", "education", "skills", "projects", "achievements"]
  const weakSections = sections.filter((section) => {
    const regex = new RegExp(`\\b${section}\\b`, "i")
    return !regex.test(resumeText)
  })

  if (weakSections.length > 0) {
    suggestions.push(`Consider adding or strengthening these sections: ${weakSections.join(", ")}`)
  }

  // Suggest using action verbs
  const actionVerbs = [
    "achieved",
    "improved",
    "trained",
    "managed",
    "created",
    "reduced",
    "increased",
    "developed",
    "implemented",
    "designed",
    "launched",
    "negotiated",
    "delivered",
    "generated",
    "led",
    "organized",
    "produced",
    "supervised",
  ]

  const usedActionVerbs = actionVerbs.filter((verb) => {
    const regex = new RegExp(`\\b${verb}\\b`, "i")
    return regex.test(resumeText)
  })

  if (usedActionVerbs.length < 5) {
    suggestions.push(
      "Use more action verbs to highlight your achievements (e.g., achieved, improved, developed, implemented, designed)",
    )
  }

  // Suggest quantifying achievements
  const hasNumbers = /\d+%|\d+ percent|\d+ times/i.test(resumeText)
  if (!hasNumbers) {
    suggestions.push(
      'Quantify your achievements with numbers (e.g., "increased sales by 20%", "reduced costs by $10,000")',
    )
  }

  // Add format suggestions
  suggestions.push("Ensure your contact information is clear and professional at the top of your resume")

  suggestions.push("Keep your resume concise and focused on relevant experience for this specific job")

  return suggestions
}
