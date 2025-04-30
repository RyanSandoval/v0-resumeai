/**
 * A simple text-based DOCX parser
 * This is a fallback for when more sophisticated parsing fails
 */

/**
 * Extract text from DOCX XML content
 * This is a very simplified approach that looks for text between XML tags
 */
export function extractTextFromDocxXml(xmlContent: string): string {
  if (!xmlContent || typeof xmlContent !== "string") {
    return ""
  }

  try {
    // Remove XML tags but keep their content
    let text = xmlContent.replace(/<[^>]+>/g, " ")

    // Replace XML entities
    text = text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")

    // Clean up whitespace
    text = text.replace(/\s+/g, " ").trim()

    return text
  } catch (error) {
    console.error("Error parsing DOCX XML:", error)
    return ""
  }
}

/**
 * Extract text from binary DOCX content by looking for text chunks
 * This is a very simplified approach that looks for readable text in the binary data
 */
export function extractTextFromBinaryDocx(binaryContent: ArrayBuffer): string {
  try {
    const uint8Array = new Uint8Array(binaryContent)
    let result = ""
    let currentWord = ""

    // Look for sequences of printable ASCII characters
    for (let i = 0; i < uint8Array.length; i++) {
      const char = uint8Array[i]

      // If it's a printable ASCII character or common whitespace
      if ((char >= 32 && char <= 126) || char === 9 || char === 10 || char === 13) {
        currentWord += String.fromCharCode(char)
      } else {
        // If we have a word and it ends, add it to the result
        if (currentWord.length > 3) {
          // Only keep "words" that are at least 4 characters
          result += currentWord + " "
        }
        currentWord = ""
      }
    }

    // Clean up the result
    result = result.replace(/\s+/g, " ").trim()

    return result
  } catch (error) {
    console.error("Error extracting text from binary DOCX:", error)
    return ""
  }
}

/**
 * Check if the extracted text looks like a resume
 */
export function looksLikeResume(text: string): boolean {
  if (!text || text.length < 100) {
    return false
  }

  // Common resume sections and terms
  const resumeTerms = [
    "resume",
    "cv",
    "curriculum vitae",
    "experience",
    "work experience",
    "employment",
    "education",
    "academic",
    "university",
    "college",
    "school",
    "skills",
    "abilities",
    "proficiencies",
    "projects",
    "portfolio",
    "contact",
    "email",
    "phone",
    "address",
    "summary",
    "profile",
    "objective",
    "references",
    "certifications",
    "awards",
  ]

  // Count how many resume terms appear in the text
  const lowerText = text.toLowerCase()
  let matchCount = 0

  for (const term of resumeTerms) {
    if (lowerText.includes(term)) {
      matchCount++
    }
  }

  // If we found at least 4 resume terms, it's likely a resume
  return matchCount >= 4
}
