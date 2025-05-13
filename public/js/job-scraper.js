/**
 * Job description scraper utility
 * Extracts job descriptions from popular job posting sites
 *
 * IMPORTANT: This implementation is for educational purposes and personal use only.
 * Always respect websites' terms of service and robots.txt when scraping.
 */

;(() => {
  // Configuration
  const CONFIG = {
    // Delay between requests (ms)
    requestDelay: 1000,
    // Maximum retries for failed requests
    maxRetries: 2,
    // Timeout for requests (ms)
    requestTimeout: 10000,
    // CORS proxies to try (in order)
    corsProxies: [
      "https://corsproxy.io/?",
      "https://cors-anywhere.herokuapp.com/",
      "https://api.allorigins.win/raw?url=",
    ],
    // User agents to rotate through
    userAgents: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    ],
    // Request headers to include
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "max-age=0",
      TE: "Trailers",
    },
  }

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
      const jobSite = identifyJobSite(hostname)

      // Show a message about ethical scraping
      console.info(
        "Fetching job description. Please note that web scraping should be done responsibly and in accordance with the website's terms of service.",
      )

      // Try to fetch the job description
      const { html, proxy } = await fetchWithRetry(url)

      // If we couldn't get the HTML, throw an error
      if (!html) {
        throw new Error("Could not retrieve the job posting. Please try copying and pasting manually.")
      }

      // Parse the HTML
      const doc = parseHtml(html)

      // Extract job data based on the job site
      const jobData = extractJobData(doc, jobSite)

      // If we couldn't extract the job description, throw an error
      if (!jobData.jobDescription) {
        throw new Error(`Could not extract job description from ${jobSite}. Please try copying and pasting manually.`)
      }

      // Log success message with the proxy used
      console.info(`Successfully extracted job description from ${jobSite} using ${proxy}`)

      return {
        jobDescription: jobData.jobDescription,
        title: jobData.title || "Job Position",
        company: jobData.company || "Company",
        source: jobSite,
      }
    } catch (error) {
      console.error("Error extracting job description:", error)
      throw new Error(`Failed to extract job description: ${error.message}`)
    }
  }

  /**
   * Identify the job site from the hostname
   * @param {string} hostname - The hostname of the URL
   * @returns {string} - The identified job site
   */
  function identifyJobSite(hostname) {
    if (hostname.includes("linkedin")) return "linkedin"
    if (hostname.includes("indeed")) return "indeed"
    if (hostname.includes("glassdoor")) return "glassdoor"
    if (hostname.includes("monster")) return "monster"
    if (hostname.includes("ziprecruiter")) return "ziprecruiter"

    throw new Error("Unsupported job site. Please use LinkedIn, Indeed, Glassdoor, Monster, or ZipRecruiter.")
  }

  /**
   * Fetch the HTML content with retry mechanism
   * @param {string} url - The URL to fetch
   * @returns {Promise<Object>} - The HTML content and the proxy used
   */
  async function fetchWithRetry(url) {
    let lastError = null

    // Try each CORS proxy
    for (const proxy of CONFIG.corsProxies) {
      // Try with different user agents
      for (const userAgent of CONFIG.userAgents) {
        // Try multiple times
        for (let attempt = 0; attempt < CONFIG.maxRetries; attempt++) {
          try {
            // Add a delay between attempts
            if (attempt > 0) {
              await delay(CONFIG.requestDelay)
            }

            // Prepare headers
            const headers = {
              ...CONFIG.headers,
              "User-Agent": userAgent,
              Referer: new URL(url).origin,
            }

            // Special handling for Indeed
            if (url.includes("indeed.com")) {
              // Add Indeed-specific headers
              headers["Cookie"] = "" // Empty cookie to start fresh
              headers["Sec-Fetch-Dest"] = "document"
              headers["Sec-Fetch-Mode"] = "navigate"
              headers["Sec-Fetch-Site"] = "same-origin"
              headers["Sec-Fetch-User"] = "?1"

              // Use a different approach for Indeed
              return await fetchIndeedJobDescription(url, headers, proxy)
            }

            // Fetch with timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeout)

            const proxyUrl = `${proxy}${encodeURIComponent(url)}`
            const response = await fetch(proxyUrl, {
              headers,
              signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const html = await response.text()
            return { html, proxy }
          } catch (error) {
            console.warn(
              `Attempt ${attempt + 1} failed with proxy ${proxy} and user agent ${userAgent.substring(0, 20)}...: ${error.message}`,
            )
            lastError = error
          }
        }
      }
    }

    // If we get here, all attempts failed
    throw lastError || new Error("Failed to fetch job description after multiple attempts")
  }

  /**
   * Special handling for Indeed job descriptions
   * @param {string} url - The Indeed job URL
   * @param {Object} headers - Request headers
   * @param {string} proxy - The CORS proxy to use
   * @returns {Promise<Object>} - The HTML content and proxy used
   */
  async function fetchIndeedJobDescription(url, headers, proxy) {
    // For Indeed, we'll use a two-step approach:
    // 1. First, fetch the main page to get cookies
    // 2. Then fetch the actual job description with those cookies

    try {
      // Step 1: Fetch the main Indeed page to get cookies
      const indeedHomeUrl = "https://www.indeed.com/"
      const controller1 = new AbortController()
      const timeoutId1 = setTimeout(() => controller1.abort(), CONFIG.requestTimeout)

      const homeResponse = await fetch(`${proxy}${encodeURIComponent(indeedHomeUrl)}`, {
        headers,
        signal: controller1.signal,
      })

      clearTimeout(timeoutId1)

      // Extract cookies from the response
      const cookies = homeResponse.headers.get("set-cookie")
      if (cookies) {
        headers["Cookie"] = cookies
      }

      // Add a delay to mimic human behavior
      await delay(1500 + Math.random() * 1000)

      // Step 2: Fetch the job description with cookies
      const controller2 = new AbortController()
      const timeoutId2 = setTimeout(() => controller2.abort(), CONFIG.requestTimeout)

      const jobResponse = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        headers,
        signal: controller2.signal,
      })

      clearTimeout(timeoutId2)

      if (!jobResponse.ok) {
        throw new Error(`HTTP error! Status: ${jobResponse.status}`)
      }

      const html = await jobResponse.text()

      // Check if we got a captcha page
      if (html.includes("captcha") || html.includes("Captcha")) {
        throw new Error("Captcha detected. Please try again later or copy the job description manually.")
      }

      return { html, proxy }
    } catch (error) {
      console.error("Error fetching Indeed job description:", error)
      throw error
    }
  }

  /**
   * Parse HTML string into a DOM document
   * @param {string} html - The HTML string
   * @returns {Document} - The parsed document
   */
  function parseHtml(html) {
    const parser = new DOMParser()
    return parser.parseFromString(html, "text/html")
  }

  /**
   * Extract job data from the parsed HTML
   * @param {Document} doc - The parsed HTML document
   * @param {string} jobSite - The job site identifier
   * @returns {Object} - The extracted job data
   */
  function extractJobData(doc, jobSite) {
    let jobDescription = ""
    let title = ""
    let company = ""

    switch (jobSite) {
      case "linkedin":
        jobDescription = extractLinkedInJobDescription(doc)
        title = extractText(doc, ".job-title, .topcard__title, h1")
        company = extractText(doc, ".company-name, .topcard__org-name-link, .company")
        break
      case "indeed":
        jobDescription = extractIndeedJobDescription(doc)
        title = extractText(doc, ".jobsearch-JobInfoHeader-title, h1.icl-u-xs-mb--xs, h1")
        company = extractText(doc, ".jobsearch-InlineCompanyRating-companyName, .icl-u-lg-mr--sm, .company")
        break
      case "glassdoor":
        jobDescription = extractGlassdoorJobDescription(doc)
        title = extractText(doc, ".job-title, h1, .css-1vg6q84")
        company = extractText(doc, ".employer-name, .css-16nw49e, .css-87uc0g")
        break
      case "monster":
        jobDescription = extractMonsterJobDescription(doc)
        title = extractText(doc, ".job-title, h1.headerstyle, h1")
        company = extractText(doc, ".company, .name, .company_name")
        break
      case "ziprecruiter":
        jobDescription = extractZipRecruiterJobDescription(doc)
        title = extractText(doc, ".job_title, h1, .hiring_job_title")
        company = extractText(doc, ".hiring_company, .company_name, .company")
        break
    }

    // Clean up the extracted text
    jobDescription = cleanJobDescription(jobDescription)
    title = title.replace(/\s+/g, " ").trim()
    company = company.replace(/\s+/g, " ").trim()

    return { jobDescription, title, company }
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
      ".jobs-box__html-content",
    ]

    return extractTextFromSelectors(doc, selectors)
  }

  /**
   * Extract Indeed job description
   */
  function extractIndeedJobDescription(doc) {
    const selectors = [
      "#jobDescriptionText",
      ".jobsearch-jobDescriptionText",
      ".job-description",
      "#jobDescription",
      "[data-testid='jobDescriptionText']",
    ]

    let description = extractTextFromSelectors(doc, selectors)

    // If we couldn't find the description with selectors, try to find it in the page content
    if (!description) {
      // Look for common section headers in Indeed job descriptions
      const possibleSections = [
        "Job description",
        "About the job",
        "Responsibilities",
        "Requirements",
        "Qualifications",
      ]

      // Get all paragraphs and divs
      const paragraphs = Array.from(doc.querySelectorAll("p, div"))

      // Find paragraphs that might contain job description content
      for (const section of possibleSections) {
        for (let i = 0; i < paragraphs.length; i++) {
          const p = paragraphs[i]
          const text = p.textContent || ""

          if (text.includes(section) && i < paragraphs.length - 1) {
            // Found a section header, grab the next few paragraphs
            let sectionContent = ""
            for (let j = i + 1; j < Math.min(i + 10, paragraphs.length); j++) {
              sectionContent += (paragraphs[j].textContent || "") + "\n"
            }

            if (sectionContent.length > 100) {
              description += sectionContent + "\n\n"
            }
          }
        }
      }
    }

    return description
  }

  /**
   * Extract Glassdoor job description
   */
  function extractGlassdoorJobDescription(doc) {
    const selectors = [".jobDescriptionContent", ".desc", ".job-description", "[data-test='jobDesc']", ".css-1uobp1k"]

    return extractTextFromSelectors(doc, selectors)
  }

  /**
   * Extract Monster job description
   */
  function extractMonsterJobDescription(doc) {
    const selectors = ["#JobDescription", ".job-description", ".details-content", ".job-description-container"]

    return extractTextFromSelectors(doc, selectors)
  }

  /**
   * Extract ZipRecruiter job description
   */
  function extractZipRecruiterJobDescription(doc) {
    const selectors = [
      ".job_description",
      "#job-description",
      ".jobDescriptionSection",
      "[data-testid='job-description']",
    ]

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
    const elements = doc.querySelectorAll(selector)
    for (const element of elements) {
      const text = (element.textContent || element.innerText).trim()
      if (text) return text
    }
    return ""
  }

  /**
   * Clean up the job description text
   */
  function cleanJobDescription(text) {
    if (!text) return ""

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
      /We are an equal opportunity employer/i,
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

  /**
   * Helper function to delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after the delay
   */
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Expose the function to the global scope
  window.extractJobDescriptionFromUrl = extractJobDescriptionFromUrl
})()
