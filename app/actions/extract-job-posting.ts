"use server"

import { load } from "cheerio"

export type JobPostingData = {
  title: string
  company: string | null
  location: string | null
  jobDescription: string | null
  requiredSkills: string[] | null
  jobType: string | null
  salary: string | null
  postDate: string | null
  applicationUrl: string | null
  source: string | null
}

export async function extractJobPosting(url: string): Promise<{
  success: boolean
  data: JobPostingData | null
  error?: string
}> {
  try {
    // Validate URL
    const parsedUrl = new URL(url)

    // Clean up LinkedIn URLs by removing tracking parameters
    if (parsedUrl.hostname.includes("linkedin.com")) {
      // Extract the job ID from the URL
      const jobIdMatch = url.match(/\/view\/(\d+)/)
      if (jobIdMatch && jobIdMatch[1]) {
        const jobId = jobIdMatch[1]
        // Create a cleaner URL
        url = `https://www.linkedin.com/jobs/view/${jobId}/`
      }
    }

    // Fetch the content with appropriate headers
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.google.com/",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
      }
    }

    const html = await response.text()

    // Extract job data based on the website
    const hostname = parsedUrl.hostname.toLowerCase()
    let source = ""

    // Load HTML with cheerio
    const $ = load(html)

    // Initialize job data with default empty values
    const jobData: JobPostingData = {
      title: "",
      company: null,
      location: null,
      jobDescription: null,
      requiredSkills: null,
      jobType: null,
      salary: null,
      postDate: null,
      applicationUrl: null,
      source: null,
    }

    // Extract based on common job sites
    if (hostname.includes("linkedin.com")) {
      source = "LinkedIn"
      jobData.source = source

      // Extract job title
      jobData.title = extractText($, ".top-card-layout__title, .job-details-jobs-unified-top-card__job-title, h1")

      // Extract company name
      jobData.company = extractText(
        $,
        ".topcard__org-name-link, .job-details-jobs-unified-top-card__company-name, .company-name",
      )

      // Extract location
      jobData.location = extractText(
        $,
        ".topcard__flavor--bullet, .job-details-jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__workplace-type",
      )

      // Extract job description
      jobData.jobDescription = extractJobDescriptionFromLinkedIn($)

      // Extract job type
      jobData.jobType = extractText($, ".job-criteria__item:contains('Employment type') .job-criteria__text")

      // Extract skills (this is more complex and might require additional parsing)
      const skillsText = extractText($, ".skills-section, .job-details-jobs-unified-top-card__job-insight")
      if (skillsText) {
        jobData.requiredSkills = parseSkills(skillsText)
      }

      // Extract post date
      jobData.postDate = extractText($, ".posted-time-ago__text, .job-details-jobs-unified-top-card__posted-date")

      // Extract application URL
      const applyButton = $("a.apply-button, a.job-details-jobs-unified-top-card__apply-button")
      if (applyButton.length > 0) {
        jobData.applicationUrl = applyButton.attr("href") || null
      } else {
        jobData.applicationUrl = url
      }
    } else if (hostname.includes("indeed.com")) {
      source = "Indeed"
      jobData.source = source

      // Extract job title
      jobData.title = extractText($, ".jobsearch-JobInfoHeader-title, .icl-u-xs-mb--xs, h1")

      // Extract company name
      jobData.company = extractText($, ".jobsearch-InlineCompanyRating-companyName, .icl-u-lg-mr--sm, .company")

      // Extract location
      jobData.location = extractText($, ".jobsearch-JobInfoHeader-subtitle .jobsearch-JobInfoHeader-subtitle-location")

      // Extract job description
      jobData.jobDescription = extractText($("#jobDescriptionText"))

      // Extract job type
      const jobDetailsSection = $(".jobsearch-JobDescriptionSection-sectionItem")
      jobDetailsSection.each((_, element) => {
        const label = $(element).find(".jobsearch-JobDescriptionSection-sectionItemKey").text().trim()
        const value = $(element).find(".jobsearch-JobDescriptionSection-sectionItemValue").text().trim()

        if (label.includes("Job Type")) {
          jobData.jobType = value
        } else if (label.includes("Salary")) {
          jobData.salary = value
        }
      })

      // Extract post date
      jobData.postDate = extractText($, ".jobsearch-JobMetadataFooter-item:contains('Posted')")

      // Extract application URL
      jobData.applicationUrl = url
    } else if (hostname.includes("glassdoor.com")) {
      source = "Glassdoor"
      jobData.source = source

      // Extract job title
      jobData.title = extractText($, ".job-title, h1, .css-1vg6q84")

      // Extract company name
      jobData.company = extractText($, ".employer-name, .css-16nw49e, .css-87uc0g")

      // Extract location
      jobData.location = extractText($, ".location, .css-1buaf54, .css-ey0tou")

      // Extract job description
      jobData.jobDescription = extractText($, ".jobDescriptionContent, .desc, .job-description")

      // Extract salary
      jobData.salary = extractText($, ".salary, .css-1xe2xww")

      // Extract post date
      jobData.postDate = extractText($, ".jobDetails .date, .css-13et3b1")

      // Extract application URL
      const applyButton = $("a.applyButton, a[data-test='apply-button']")
      if (applyButton.length > 0) {
        jobData.applicationUrl = applyButton.attr("href") || null
      } else {
        jobData.applicationUrl = url
      }
    } else {
      // Generic extraction for other sites
      source = parsedUrl.hostname.replace("www.", "")
      jobData.source = source

      // Try to extract job title
      jobData.title = extractText(
        $,
        "h1, .job-title, .jobtitle, .jobTitle, .position-title, [data-testid='job-title'], .headline",
      )

      // Try to extract company name
      jobData.company = extractText($, ".company, .company-name, .companyName, .employer, [data-testid='company-name']")

      // Try to extract location
      jobData.location = extractText($, ".location, .job-location, .jobLocation, [data-testid='job-location']")

      // Try to extract job description
      jobData.jobDescription = extractText(
        $,
        ".job-description, .jobDescription, #job-description, [data-testid='job-description']",
      )

      // If we couldn't extract the job description, try to get the main content
      if (!jobData.jobDescription) {
        jobData.jobDescription = extractText($, "main") || extractText($, "article")
      }

      // Application URL
      jobData.applicationUrl = url
    }

    // Clean up the extracted data
    for (const key in jobData) {
      if (typeof jobData[key as keyof JobPostingData] === "string") {
        const value = jobData[key as keyof JobPostingData] as string
        if (value) {
          jobData[key as keyof JobPostingData] = value.replace(/\s+/g, " ").trim() as any
        }
      }
    }

    // If we couldn't extract the job title, return an error
    if (!jobData.title) {
      return {
        success: false,
        data: null,
        error: `Could not extract job title from ${source}. The site may be using JavaScript to load content or requires authentication.`,
      }
    }

    return {
      success: true,
      data: jobData,
    }
  } catch (error) {
    console.error("Error extracting job posting:", error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Helper function to extract text from a selector
function extractText($: any, selector: string): string {
  const element = $(selector)
  if (element.length > 0) {
    return element.text().trim()
  }
  return ""
}

// Helper function to extract job description from LinkedIn
function extractJobDescriptionFromLinkedIn($: any): string {
  // Try multiple selectors for LinkedIn job descriptions
  const selectors = [
    ".description__text",
    ".show-more-less-html__markup",
    ".job-description",
    ".jobs-description",
    ".jobs-description-content",
    "[data-test-id='job-description']",
    "#job-details",
    ".jobs-box__html-content",
  ]

  let jobDescription = ""

  for (const selector of selectors) {
    const element = $(selector)
    if (element.length > 0) {
      jobDescription += element.text().trim() + "\n"
    }
  }

  // If still no content, try to find the job description section
  if (!jobDescription) {
    $("section").each((_: any, section: any) => {
      const sectionText = $(section).text()
      if (
        sectionText.includes("About the job") ||
        sectionText.includes("Job description") ||
        sectionText.includes("Responsibilities") ||
        sectionText.includes("Qualifications")
      ) {
        jobDescription += sectionText + "\n"
      }
    })
  }

  return jobDescription
}

// Helper function to parse skills from text
function parseSkills(text: string): string[] {
  // This is a simplified approach - in a real implementation, you might want to use NLP
  // or a predefined list of skills to extract more accurately
  const skillKeywords = [
    "skills",
    "requirements",
    "qualifications",
    "proficient in",
    "experience with",
    "knowledge of",
    "familiar with",
  ]

  let skillsSection = ""

  // Try to find a skills section
  const lines = text.split("\n")
  let inSkillsSection = false

  for (const line of lines) {
    const lowerLine = line.toLowerCase()

    // Check if this line starts a skills section
    if (!inSkillsSection) {
      for (const keyword of skillKeywords) {
        if (lowerLine.includes(keyword)) {
          inSkillsSection = true
          skillsSection += line + "\n"
          break
        }
      }
    } else {
      // If we're already in a skills section, add the line
      skillsSection += line + "\n"

      // Check if this line might end the skills section (e.g., a new section header)
      if (line.length < 50 && line.endsWith(":")) {
        inSkillsSection = false
      }
    }
  }

  // If we couldn't find a dedicated skills section, use the whole text
  if (!skillsSection) {
    skillsSection = text
  }

  // Extract potential skills (words or phrases that might be skills)
  const skillMatches = skillsSection.match(/[A-Za-z0-9][\w+#.-]+(?: [\w+#.-]+){0,3}/g) || []

  // Filter out common words and keep likely skills
  const commonWords = ["the", "and", "or", "in", "on", "at", "to", "for", "with", "a", "an", "of", "is", "are", "be"]
  const skills = skillMatches
    .filter((skill) => skill.length > 2) // Filter out short words
    .filter((skill) => !commonWords.includes(skill.toLowerCase())) // Filter out common words
    .map((skill) => skill.trim())
    .filter((skill, index, self) => self.indexOf(skill) === index) // Remove duplicates

  return skills
}
