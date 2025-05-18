"use server"

import { load } from "cheerio"

export async function extractJobDescription(url: string): Promise<{
  success: boolean
  jobDescription: string
  error?: string
  source?: string
  jobTitle?: string
  companyName?: string
  location?: string
  jobType?: string
  salary?: string
  skills?: string[]
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
        jobDescription: "",
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
      }
    }

    const html = await response.text()

    // Extract job description based on the website
    const hostname = parsedUrl.hostname.toLowerCase()
    let jobDescription = ""
    let source = ""
    let jobTitle = ""
    let companyName = ""
    let location = ""
    let jobType = ""
    let salary = ""
    let skills: string[] = []

    // Load HTML with cheerio
    const $ = load(html)

    // Extract based on common job sites
    if (hostname.includes("linkedin.com")) {
      source = "LinkedIn"

      // Extract job title
      jobTitle =
        $("h1.job-title").text().trim() ||
        $(".job-details-jobs-unified-top-card__job-title").text().trim() ||
        $("h1").first().text().trim()

      // Extract company name
      companyName =
        $(".jobs-unified-top-card__company-name").text().trim() ||
        $(".job-details-jobs-unified-top-card__company-name").text().trim() ||
        $(".topcard__org-name-link").text().trim()

      // Extract location
      location =
        $(".jobs-unified-top-card__bullet").first().text().trim() ||
        $(".job-details-jobs-unified-top-card__bullet").first().text().trim() ||
        $(".topcard__flavor--bullet").first().text().trim()

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

      for (const selector of selectors) {
        const element = $(selector)
        if (element.length > 0) {
          jobDescription += element.text() + "\n"
        }
      }

      // If still no content, try to find the job description section
      if (!jobDescription) {
        $("section").each((_, section) => {
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

      // Last resort: look for specific keywords in any div
      if (!jobDescription) {
        $("div").each((_, div) => {
          const divText = $(div).text()
          if (
            divText.includes("Requirements") ||
            divText.includes("Qualifications") ||
            divText.includes("Responsibilities") ||
            divText.includes("About the role")
          ) {
            jobDescription += divText + "\n"
          }
        })
      }

      // Extract skills (LinkedIn sometimes has them in a separate section)
      $(".job-details-how-you-match-card__skills-item").each((_, skill) => {
        skills.push($(skill).text().trim())
      })
    } else if (hostname.includes("indeed.com")) {
      source = "Indeed"

      // Extract job title
      jobTitle = $(".jobsearch-JobInfoHeader-title").text().trim() || $("h1.icl-u-xs-mb--xs").text().trim()

      // Extract company name
      companyName =
        $(".jobsearch-InlineCompanyRating-companyHeader").text().trim() ||
        $("div[data-company-name=true]").text().trim()

      // Extract location
      location =
        $(".jobsearch-JobInfoHeader-subtitle .jobsearch-JobInfoHeader-subtitle-location").text().trim() ||
        $(".icl-u-xs-mt--xs").text().trim()

      // Extract job type
      jobType = $(".jobsearch-JobMetadataHeader-item").first().text().trim()

      // Extract salary if available
      salary = $(".jobsearch-JobMetadataHeader-item:contains('$')").text().trim()

      // Indeed job descriptions
      jobDescription = $("#jobDescriptionText").text()
    } else if (hostname.includes("glassdoor.com")) {
      source = "Glassdoor"

      // Extract job title
      jobTitle = $("h1.job-title").text().trim() || $("h1.jobTitle").text().trim()

      // Extract company name
      companyName = $(".employer-name").text().trim() || $(".employerName").text().trim()

      // Extract location
      location = $(".location").text().trim() || $(".job-location").text().trim()

      // Glassdoor job descriptions
      jobDescription = $(".jobDescriptionContent").text() || $(".desc").text()
    } else if (hostname.includes("monster.com")) {
      source = "Monster"

      // Extract job title
      jobTitle = $(".job-title").text().trim()

      // Extract company name
      companyName = $(".company-name").text().trim()

      // Extract location
      location = $(".location").text().trim()

      // Monster job descriptions
      jobDescription = $(".job-description").text()
    } else if (hostname.includes("ziprecruiter.com")) {
      source = "ZipRecruiter"

      // Extract job title
      jobTitle = $("h1.job_title").text().trim()

      // Extract company name
      companyName = $(".hiring_company_text").text().trim()

      // Extract location
      location = $(".location").text().trim()

      // ZipRecruiter job descriptions
      jobDescription = $(".job_description").text()
    } else {
      // Generic extraction for other sites
      source = parsedUrl.hostname.replace("www.", "")

      // Try to extract job title
      jobTitle = $("h1").first().text().trim()

      // Try to extract company name
      companyName = $("meta[property='og:site_name']").attr("content") || ""

      // Try common job description selectors
      const possibleSelectors = [
        ".job-description",
        ".jobDescription",
        ".job_description",
        "#job-description",
        "#jobDescription",
        ".description",
        "[data-testid='job-description']",
        "[data-automation='jobDescription']",
        "section:contains('Job Description')",
        "div:contains('Job Description')",
      ]

      for (const selector of possibleSelectors) {
        const element = $(selector)
        if (element.length > 0) {
          jobDescription = element.text()
          break
        }
      }

      // If still no content, try to get the main content
      if (!jobDescription) {
        jobDescription = $("main").text() || $("article").text()
      }

      // Last resort: get all text from the body and try to find job-related content
      if (!jobDescription) {
        const bodyText = $("body").text()
        const lines = bodyText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)

        // Look for sections that might contain job descriptions
        const jobSections = lines.filter((line) =>
          /job description|responsibilities|requirements|qualifications|about this job|what you'll do/i.test(line),
        )

        if (jobSections.length > 0) {
          // Get text around these sections
          const jobSectionIndex = lines.findIndex((line) => jobSections.some((section) => line.includes(section)))

          if (jobSectionIndex >= 0) {
            // Get 30 lines after the job section header
            jobDescription = lines.slice(jobSectionIndex, jobSectionIndex + 30).join("\n")
          }
        }
      }
    }

    // Clean up the extracted text
    jobDescription = jobDescription.replace(/\s+/g, " ").replace(/\n+/g, "\n").replace(/\t+/g, " ").trim()

    // Extract skills from job description if not already found
    if (skills.length === 0 && jobDescription) {
      // Common skill keywords to look for
      const skillKeywords = [
        "JavaScript",
        "React",
        "Angular",
        "Vue",
        "Node.js",
        "Python",
        "Java",
        "C#",
        "C++",
        "Ruby",
        "PHP",
        "Swift",
        "Kotlin",
        "SQL",
        "NoSQL",
        "MongoDB",
        "MySQL",
        "PostgreSQL",
        "AWS",
        "Azure",
        "GCP",
        "Docker",
        "Kubernetes",
        "CI/CD",
        "Git",
        "Agile",
        "Scrum",
        "Project Management",
        "Communication",
        "Leadership",
        "Problem Solving",
        "Analytical",
        "Excel",
        "Word",
        "PowerPoint",
        "Photoshop",
        "Illustrator",
        "UI/UX",
        "Design",
        "Marketing",
        "Sales",
        "Customer Service",
        "SEO",
        "SEM",
        "Content Writing",
      ]

      // Look for skills in the job description
      skills = skillKeywords.filter((skill) => new RegExp(`\\b${skill}\\b`, "i").test(jobDescription))
    }

    if (!jobDescription) {
      // If we couldn't extract the job description, try to extract the job title and company at least
      const jobTitle = $("title").text() || $("h1").first().text()
      const company = $("meta[property='og:site_name']").attr("content") || ""

      return {
        success: false,
        jobDescription: "",
        error: `Could not extract job description from ${source}. The site may be using JavaScript to load content or requires authentication.`,
        source: `${source} - ${jobTitle} ${company}`,
      }
    }

    return {
      success: true,
      jobDescription,
      source,
      jobTitle,
      companyName,
      location,
      jobType,
      salary,
      skills,
    }
  } catch (error) {
    console.error("Error extracting job description:", error)
    return {
      success: false,
      jobDescription: "",
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
