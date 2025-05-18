/**
 * Validates if a string is a properly formatted job posting URL
 */
export function isValidJobUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
  } catch (error) {
    return false
  }
}

/**
 * Checks if a URL is from a known job posting site
 */
export function isKnownJobSite(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.toLowerCase()

    const knownJobSites = [
      "linkedin.com",
      "indeed.com",
      "glassdoor.com",
      "monster.com",
      "ziprecruiter.com",
      "dice.com",
      "careerbuilder.com",
      "simplyhired.com",
      "lever.co",
      "greenhouse.io",
      "workday.com",
      "jobs.apple.com",
      "careers.google.com",
      "amazon.jobs",
      "jobs.microsoft.com",
      "wellfound.com",
      "remoteworker.jobs",
      "remoteok.com",
      "weworkremotely.com",
      "flexjobs.com",
      "upwork.com",
      "freelancer.com",
      "fiverr.com",
      "toptal.com",
      "angel.co",
    ]

    return knownJobSites.some((site) => hostname.includes(site))
  } catch (error) {
    return false
  }
}

/**
 * Cleans a job posting URL by removing tracking parameters
 */
export function cleanJobUrl(url: string): string {
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
 * Extracts the job ID from common job posting URLs
 */
export function extractJobId(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.toLowerCase()
    const pathname = parsedUrl.pathname

    // LinkedIn job ID extraction
    if (hostname.includes("linkedin.com")) {
      const match = pathname.match(/\/view\/(\d+)/)
      if (match && match[1]) {
        return match[1]
      }
    }

    // Indeed job ID extraction
    if (hostname.includes("indeed.com")) {
      const match = pathname.match(/\/viewjob\?jk=([a-zA-Z0-9]+)/)
      if (match && match[1]) {
        return match[1]
      }
    }

    // Glassdoor job ID extraction
    if (hostname.includes("glassdoor.com")) {
      const match = pathname.match(/\/job-listing\/[^/]+\/([a-zA-Z0-9]+)/)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch (error) {
    return null
  }
}
