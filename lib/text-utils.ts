/**
 * Utility functions for text processing and comparison
 */

/**
 * Normalizes text by removing extra whitespace, standardizing line breaks, etc.
 * @param text Text to normalize
 * @returns Normalized text
 */
export function normalizeText(text: string): string {
  if (!text) return ""

  return text
    .replace(/\r\n/g, "\n") // Standardize line breaks
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .trim() // Remove leading/trailing whitespace
}

/**
 * Finds the differences between two strings and returns HTML with highlights
 * @param oldText Original text
 * @param newText Modified text
 * @returns HTML string with differences highlighted
 */
export function highlightDifferences(oldText: string, newText: string): string {
  if (!oldText || !newText) {
    return newText || ""
  }

  // Split texts into words for comparison
  const oldWords = oldText.split(/\s+/)
  const newWords = newText.split(/\s+/)

  // Create a map of old words for quick lookup
  const oldWordsMap = new Map<string, number>()
  oldWords.forEach((word, index) => {
    oldWordsMap.set(word.toLowerCase().replace(/[.,;:!?()]/g, ""), index)
  })

  // Mark added or modified words
  const result = newWords.map((word) => {
    const cleanWord = word.toLowerCase().replace(/[.,;:!?()]/g, "")

    // If word exists in old text, return as is
    if (oldWordsMap.has(cleanWord)) {
      return word
    }

    // Word is new or modified, highlight it
    return `<span class="bg-green-100 text-green-800 px-1 rounded">${word}</span>`
  })

  return result.join(" ")
}

/**
 * Compares two sections of text and returns a percentage of similarity
 * @param text1 First text
 * @param text2 Second text
 * @returns Percentage of similarity (0-100)
 */
export function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) {
    return 0
  }

  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)

  const set1 = new Set(words1)
  const set2 = new Set(words2)

  let intersection = 0
  set2.forEach((word) => {
    if (set1.has(word)) {
      intersection++
    }
  })

  const union = set1.size + set2.size - intersection

  return Math.round((intersection / union) * 100)
}

/**
 * Sanitizes text for safe display in HTML
 * @param text Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return ""

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Counts the occurrences of keywords in a text
 * @param text Text to search in
 * @param keywords Array of keywords to count
 * @returns Object with keyword counts
 */
export function countKeywords(text: string, keywords: string[]): Record<string, number> {
  if (!text || !keywords || keywords.length === 0) {
    return {}
  }

  const lowercaseText = text.toLowerCase()
  const counts: Record<string, number> = {}

  keywords.forEach((keyword) => {
    const lowercaseKeyword = keyword.toLowerCase()
    const regex = new RegExp(`\\b${lowercaseKeyword}\\b`, "gi")
    const matches = lowercaseText.match(regex)
    counts[keyword] = matches ? matches.length : 0
  })

  return counts
}

/**
 * Highlights keywords in a text
 * @param text Text to highlight keywords in
 * @param keywords Array of keywords to highlight
 * @returns HTML string with highlighted keywords
 */
export function highlightKeywords(text: string, keywords: string[]): string {
  if (!text || !keywords || keywords.length === 0) {
    return text || ""
  }

  let highlightedText = text

  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b(${keyword})\\b`, "gi")
    highlightedText = highlightedText.replace(regex, '<span class="bg-blue-100 text-blue-800 px-1 rounded">$1</span>')
  })

  return highlightedText
}
