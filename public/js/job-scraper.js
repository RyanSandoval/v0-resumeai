/**
 * Job description scraper utility
 * Extracts job descriptions from popular job posting sites
 */

;(() => {
  // CORS proxy to bypass cross-origin restrictions
  const CORS_PROXY = "https://corsproxy.io/?"

  /**
   * Main function to extract job description from URL
   * @param {string} url - The job posting URL
   * @returns {Promise<Object>} - Job data including description, title, company, and source
   */
  async function extractJobDescriptionFromUrl(url) {
    try {
      // Validate URL format
      const jobUrl = new URL(url)
      const hostname = jobUrl.hostname.toLowerCase()

      // Determine which job site we're dealing with
      let jobSite = ""
      if (hostname.includes("linkedin")) {
        jobSite = "linkedin"
      } else if (hostname.includes("indeed")) {
        jobSite = "indeed"
      } else if (hostname.includes("glassdoor")) {
        jobSite = "glassdoor"
      } else if (hostname.includes("monster")) {
        jobSite = "monster"
      } else if (hostname.includes("ziprecruiter")) {
        jobSite = "ziprecruiter"
      } else {
        throw new Error("Unsupported job site. Please use LinkedIn, Indeed, Glassdoor, Monster, or ZipRecruiter.")
      }

      // Fetch the job posting page
      const response = await fetch(CORS_PROXY + url)
      if (!response.ok) {
        throw new Error(`Failed to fetch job posting. Status: ${response.status}`)
      }

      const html = await response.text()

      // Create a DOM parser to parse the HTML
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      // Extract job description based on the job site
      let jobDescription = ""
      let jobTitle = ""
      let company = ""

      switch (jobSite) {
        case "linkedin":
          jobDescription = extractLinkedInJobDescription(doc)
          jobTitle = extractText(doc, ".job-title") || extractText(doc, "h1")
          company = extractText(doc, ".company-name") || extractText(doc, ".topcard__org-name-link")
          break
        case "indeed":
          jobDescription = extractIndeedJobDescription(doc)
          jobTitle = extractText(doc, ".jobsearch-JobInfoHeader-title") || extractText(doc, "h1.icl-u-xs-mb--xs")
          company =
            extractText(doc, ".jobsearch-InlineCompanyRating-companyName") || extractText(doc, ".icl-u-lg-mr--sm")
          break
        case "glassdoor":
          jobDescription = extractGlassdoorJobDescription(doc)
          jobTitle = extractText(doc, ".job-title") || extractText(doc, "h1")
          company = extractText(doc, ".employer-name") || extractText(doc, ".css-16nw49e")
          break
        case "monster":
          jobDescription = extractMonsterJobDescription(doc)
          jobTitle = extractText(doc, ".job-title") || extractText(doc, "h1.headerstyle")
          company = extractText(doc, ".company") || extractText(doc, ".name")
          break
        case "ziprecruiter":
          jobDescription = extractZipRecruiterJobDescription(doc)
          jobTitle = extractText(doc, ".job_title") || extractText(doc, "h1")
          company = extractText(doc, ".hiring_company") || extractText(doc, ".company_name")
          break
      }

      // If we couldn't extract the job description, throw an error
      if (!jobDescription) {
        throw new Error(`Could not extract job description from ${jobSite}. Please try copying and pasting manually.`)
      }

      // Clean up the job description
      jobDescription = cleanJobDescription(jobDescription)

      return {
        jobDescription,
        title: jobTitle || "Job Position",
        company: company || "Company",
        source: jobSite,
      }
    } catch (error) {
      console.error("Error extracting job description:", error)
      throw new Error(`Failed to extract job description: ${error.message}`)
    }
  }

  /**
   * Extract LinkedIn job description
   */
  function extractLinkedInJobDescription(doc) {
    // Try different selectors that LinkedIn might use
    const selectors = [
      ".description__text",
      ".show-more-less-html__markup",
      "#job-details",
      ".jobs-description-content",
    ]

    return extractTextFromSelectors(doc, selectors)
  }

  /**
   * Extract Indeed job description
   */
  function extractIndeedJobDescription(doc) {
    const selectors = ["#jobDescriptionText", ".jobsearch-jobDescriptionText", ".job-description"]

    return extractTextFromSelectors(doc, selectors)
  }

  /**
   * Extract Glassdoor job description
   */
  function extractGlassdoorJobDescription(doc) {
    const selectors = [".jobDescriptionContent", ".desc", ".job-description"]

    return extractTextFromSelectors(doc, selectors)
  }

  /**
   * Extract Monster job description
   */
  function extractMonsterJobDescription(doc) {
    const selectors = ["#JobDescription", ".job-description", ".details-content"]

    return extractTextFromSelectors(doc, selectors)
  }

  /**
   * Extract ZipRecruiter job description
   */
  function extractZipRecruiterJobDescription(doc) {
    const selectors = [".job_description", "#job-description", ".jobDescriptionSection"]

    return extractTextFromSelectors(doc, selectors)
  }

  /**
   * Helper function to extract text from a list of selectors
   * @param {Document} doc - The parsed HTML document
   * @param {Array<string>} selectors - List of CSS selectors to try
   * @returns {string} - The extracted text or empty string
   */
  function extractTextFromSelectors(doc, selectors) {
    for (const selector of selectors) {
      const element = doc.querySelector(selector)
      if (element) {
        return element.textContent || element.innerText
      }
    }

    // If no selectors matched, try to find any div with job description keywords
    const allDivs = doc.querySelectorAll("div")
    for (const div of allDivs) {
      const text = div.textContent || div.innerText
      if (
        text &&
        text.length > 200 &&
        (text.includes("responsibilities") ||
          text.includes("requirements") ||
          text.includes("qualifications") ||
          text.includes("about the job"))
      ) {
        return text
      }
    }

    return ""
  }

  /**
   * Helper function to extract text from a single selector
   */
  function extractText(doc, selector) {
    const element = doc.querySelector(selector)
    return element ? (element.textContent || element.innerText).trim() : ""
  }

  /**
   * Clean up the job description text
   */
  function cleanJobDescription(text) {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, " ")

    // Remove common boilerplate text
    const boilerplatePatterns = [
      /About LinkedIn/i,
      /About Indeed/i,
      /About Glassdoor/i,
      /About Monster/i,
      /About ZipRecruiter/i,
      /Equal Opportunity Employer/i,
    ]

    for (const pattern of boilerplatePatterns) {
      const match = cleaned.match(pattern)
      if (match && match.index) {
        // Keep text before the boilerplate
        cleaned = cleaned.substring(0, match.index)
      }
    }

    return cleaned.trim()
  }

  // Expose the function to the global scope
  window.extractJobDescriptionFromUrl = extractJobDescriptionFromUrl
})()
