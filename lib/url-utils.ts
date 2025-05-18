/**
 * Validates if a string is a properly formatted URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
  } catch (error) {
    return false
  }
}

/**
 * Extracts the domain name from a URL
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname.replace("www.", "")
  } catch (error) {
    return ""
  }
}

/**
 * Sanitizes a URL by removing tracking parameters
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)

    // Common tracking parameters to remove
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "msclkid",
      "ref",
      "_ga",
    ]

    // Create a new URLSearchParams object
    const params = new URLSearchParams(parsedUrl.search)

    // Remove tracking parameters
    trackingParams.forEach((param) => {
      params.delete(param)
    })

    // Update the URL search
    parsedUrl.search = params.toString()

    return parsedUrl.toString()
  } catch (error) {
    return url
  }
}

/**
 * Checks if a URL is likely to be a resume page
 */
export function isLikelyResumePage(url: string): boolean {
  const resumeKeywords = [
    "resume",
    "cv",
    "curriculum-vitae",
    "curriculum_vitae",
    "curriculumvitae",
    "profile",
    "portfolio",
    "about-me",
    "about_me",
    "aboutme",
  ]

  try {
    const parsedUrl = new URL(url)
    const path = parsedUrl.pathname.toLowerCase()

    // Check if any resume keywords are in the path
    return resumeKeywords.some((keyword) => path.includes(keyword))
  } catch (error) {
    return false
  }
}
