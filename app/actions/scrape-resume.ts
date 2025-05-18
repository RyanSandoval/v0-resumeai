"use server"

import { load } from "cheerio"
import type cheerio from "cheerio"

export type ScrapedResumeData = {
  fullName?: string
  contactInfo?: {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
  }
  summary?: string
  experience?: Array<{
    title?: string
    company?: string
    date?: string
    description?: string[]
  }>
  education?: Array<{
    degree?: string
    institution?: string
    date?: string
    description?: string
  }>
  skills?: string[]
  certifications?: string[]
  rawText?: string
}

export async function scrapeResumeFromUrl(url: string): Promise<{
  success: boolean
  data?: ScrapedResumeData
  error?: string
  source?: string
}> {
  try {
    // Validate URL
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.toLowerCase()

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
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
      }
    }

    const html = await response.text()
    const $ = load(html)
    const scrapedData: ScrapedResumeData = { rawText: "" }
    const source = hostname.replace("www.", "")

    // Common resume sections to look for
    const sectionKeywords = {
      summary: ["summary", "profile", "about", "objective", "professional summary"],
      experience: ["experience", "work experience", "employment", "work history", "professional experience"],
      education: ["education", "academic", "degree", "university", "college", "school"],
      skills: ["skills", "expertise", "competencies", "technical skills", "proficiencies"],
      certifications: ["certifications", "certificates", "licenses", "credentials"],
    }

    // Extract full name - usually the most prominent heading
    scrapedData.fullName = $("h1").first().text().trim() || $("title").text().split("|")[0]?.trim()

    // Extract contact information
    scrapedData.contactInfo = {
      email: extractEmail($),
      phone: extractPhone($),
      location: extractLocation($),
      linkedin: extractLinkedIn($),
      website: extractWebsite($),
    }

    // Extract summary
    scrapedData.summary = extractSection($, sectionKeywords.summary)

    // Extract experience
    scrapedData.experience = extractExperienceItems($, sectionKeywords.experience)

    // Extract education
    scrapedData.education = extractEducationItems($, sectionKeywords.education)

    // Extract skills
    scrapedData.skills = extractSkillsList($, sectionKeywords.skills)

    // Extract certifications
    scrapedData.certifications = extractCertificationsList($, sectionKeywords.certifications)

    // Extract raw text as fallback
    scrapedData.rawText = $("body").text().replace(/\s+/g, " ").trim()

    // Check if we have enough data
    const hasMinimalData =
      (scrapedData.fullName && scrapedData.fullName.length > 0) ||
      (scrapedData.experience && scrapedData.experience.length > 0) ||
      (scrapedData.education && scrapedData.education.length > 0) ||
      (scrapedData.skills && scrapedData.skills.length > 0)

    if (!hasMinimalData) {
      return {
        success: false,
        error: "Could not extract sufficient resume data from the provided URL",
        source,
      }
    }

    return {
      success: true,
      data: scrapedData,
      source,
    }
  } catch (error) {
    console.error("Error scraping resume:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Helper functions for extraction
function extractEmail($: cheerio.CheerioAPI): string | undefined {
  // Look for email patterns
  const bodyText = $("body").text()
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const emailMatches = bodyText.match(emailRegex)

  if (emailMatches && emailMatches.length > 0) {
    return emailMatches[0]
  }

  // Look for elements with email-related attributes
  const emailElement = $('[href^="mailto:"]').first()
  if (emailElement.length) {
    const href = emailElement.attr("href")
    return href ? href.replace("mailto:", "") : undefined
  }

  return undefined
}

function extractPhone($: cheerio.CheerioAPI): string | undefined {
  // Look for phone patterns
  const bodyText = $("body").text()
  const phoneRegex = /\b(\+\d{1,3}[\s-]?)?$$?\d{3}$$?[\s.-]?\d{3}[\s.-]?\d{4}\b/g
  const phoneMatches = bodyText.match(phoneRegex)

  if (phoneMatches && phoneMatches.length > 0) {
    return phoneMatches[0]
  }

  // Look for elements with phone-related attributes
  const phoneElement = $('[href^="tel:"]').first()
  if (phoneElement.length) {
    const href = phoneElement.attr("href")
    return href ? href.replace("tel:", "") : undefined
  }

  return undefined
}

function extractLocation($: cheerio.CheerioAPI): string | undefined {
  // Look for location patterns in specific elements
  const locationSelectors = [
    ".location",
    ".address",
    "[itemprop='address']",
    "[itemprop='location']",
    ".contact-info .location",
    ".contact .location",
  ]

  for (const selector of locationSelectors) {
    const locationElement = $(selector).first()
    if (locationElement.length && locationElement.text().trim()) {
      return locationElement.text().trim()
    }
  }

  // Look for common location patterns
  const bodyText = $("body").text()
  const cityStateRegex = /\b[A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*,\s*[A-Z]{2}\b/
  const locationMatches = bodyText.match(cityStateRegex)

  if (locationMatches && locationMatches.length > 0) {
    return locationMatches[0]
  }

  return undefined
}

function extractLinkedIn($: cheerio.CheerioAPI): string | undefined {
  // Look for LinkedIn links
  const linkedinElement = $('a[href*="linkedin.com"]').first()
  if (linkedinElement.length) {
    return linkedinElement.attr("href") || undefined
  }

  // Look for LinkedIn text patterns
  const bodyText = $("body").text()
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/
  const linkedinMatches = bodyText.match(linkedinRegex)

  if (linkedinMatches && linkedinMatches.length > 0) {
    return `https://${linkedinMatches[0]}`
  }

  return undefined
}

function extractWebsite($: cheerio.CheerioAPI): string | undefined {
  // Look for personal website links
  const websiteSelectors = ["a.website", "a.portfolio", ".website a", ".portfolio a", ".personal-site a"]

  for (const selector of websiteSelectors) {
    const websiteElement = $(selector).first()
    if (websiteElement.length) {
      return websiteElement.attr("href") || undefined
    }
  }

  return undefined
}

function extractSection($: cheerio.CheerioAPI, keywords: string[]): string | undefined {
  // Try to find sections by headings
  for (const keyword of keywords) {
    // Look for headings containing the keyword
    const headingSelectors = ["h1", "h2", "h3", "h4", "h5", "h6", ".section-heading", ".heading"]

    for (const selector of headingSelectors) {
      const headings = $(selector).filter((_, el) => {
        const text = $(el).text().toLowerCase()
        return text.includes(keyword)
      })

      if (headings.length > 0) {
        const heading = headings.first()
        // Get the content following this heading until the next heading
        let content = ""
        let nextElement = heading.next()

        while (nextElement.length && !nextElement.is("h1, h2, h3, h4, h5, h6, .section-heading, .heading")) {
          content += nextElement.text() + " "
          nextElement = nextElement.next()
        }

        if (content.trim()) {
          return content.trim()
        }
      }
    }

    // Look for sections with class or ID containing the keyword
    const sectionSelectors = [
      `#${keyword}`,
      `.${keyword}`,
      `[id*="${keyword}"]`,
      `[class*="${keyword}"]`,
      `section[data-section="${keyword}"]`,
    ]

    for (const selector of sectionSelectors) {
      const section = $(selector).first()
      if (section.length && section.text().trim()) {
        return section.text().trim()
      }
    }
  }

  return undefined
}

function extractExperienceItems(
  $: cheerio.CheerioAPI,
  keywords: string[],
):
  | Array<{
      title?: string
      company?: string
      date?: string
      description?: string[]
    }>
  | undefined {
  const experienceItems: Array<{
    title?: string
    company?: string
    date?: string
    description?: string[]
  }> = []

  // Try to find experience section
  for (const keyword of keywords) {
    // Look for headings containing the keyword
    const headingSelectors = ["h1", "h2", "h3", "h4", "h5", "h6", ".section-heading", ".heading"]

    for (const selector of headingSelectors) {
      const headings = $(selector).filter((_, el) => {
        const text = $(el).text().toLowerCase()
        return text.includes(keyword)
      })

      if (headings.length > 0) {
        const heading = headings.first()
        // Look for experience items in the section
        let currentElement = heading.next()

        // Look for common experience item patterns
        while (currentElement.length && !currentElement.is("h1, h2, h3, h4, h5, h6, .section-heading, .heading")) {
          // Check if this element looks like a job entry
          if (
            currentElement.is(".job, .position, .experience-item, .work-item") ||
            currentElement.find(".job-title, .position-title, .company").length
          ) {
            const item = extractExperienceItem($, currentElement)
            if (item.title || item.company) {
              experienceItems.push(item)
            }
          }

          currentElement = currentElement.next()
        }

        // If we found items, return them
        if (experienceItems.length > 0) {
          return experienceItems
        }
      }
    }
  }

  // If we couldn't find structured experience items, try to extract from the whole page
  $(".job, .position, .experience-item, .work-item").each((_, el) => {
    const item = extractExperienceItem($, $(el))
    if (item.title || item.company) {
      experienceItems.push(item)
    }
  })

  return experienceItems.length > 0 ? experienceItems : undefined
}

function extractExperienceItem(
  $: cheerio.CheerioAPI,
  element: cheerio.Cheerio<cheerio.Element>,
): {
  title?: string
  company?: string
  date?: string
  description?: string[]
} {
  const item: {
    title?: string
    company?: string
    date?: string
    description?: string[]
  } = {}

  // Extract job title
  const titleElement = element.find(".job-title, .position-title, .title").first()
  if (titleElement.length) {
    item.title = titleElement.text().trim()
  }

  // Extract company
  const companyElement = element.find(".company, .organization, .employer").first()
  if (companyElement.length) {
    item.company = companyElement.text().trim()
  }

  // Extract date
  const dateElement = element.find(".date, .period, .duration, .dates").first()
  if (dateElement.length) {
    item.date = dateElement.text().trim()
  }

  // Extract description
  const descriptionElements = element.find(".description, .details, .responsibilities, p, li")
  if (descriptionElements.length) {
    item.description = []
    descriptionElements.each((_, el) => {
      const text = $(el).text().trim()
      if (text) {
        item.description!.push(text)
      }
    })
  }

  return item
}

function extractEducationItems(
  $: cheerio.CheerioAPI,
  keywords: string[],
):
  | Array<{
      degree?: string
      institution?: string
      date?: string
      description?: string
    }>
  | undefined {
  const educationItems: Array<{
    degree?: string
    institution?: string
    date?: string
    description?: string
  }> = []

  // Similar approach as experience extraction
  for (const keyword of keywords) {
    const headingSelectors = ["h1", "h2", "h3", "h4", "h5", "h6", ".section-heading", ".heading"]

    for (const selector of headingSelectors) {
      const headings = $(selector).filter((_, el) => {
        const text = $(el).text().toLowerCase()
        return text.includes(keyword)
      })

      if (headings.length > 0) {
        const heading = headings.first()
        let currentElement = heading.next()

        while (currentElement.length && !currentElement.is("h1, h2, h3, h4, h5, h6, .section-heading, .heading")) {
          if (
            currentElement.is(".education-item, .degree, .school") ||
            currentElement.find(".degree, .institution, .university").length
          ) {
            const item = extractEducationItem($, currentElement)
            if (item.degree || item.institution) {
              educationItems.push(item)
            }
          }

          currentElement = currentElement.next()
        }

        if (educationItems.length > 0) {
          return educationItems
        }
      }
    }
  }

  // Try to extract from the whole page
  $(".education-item, .degree, .school").each((_, el) => {
    const item = extractEducationItem($, $(el))
    if (item.degree || item.institution) {
      educationItems.push(item)
    }
  })

  return educationItems.length > 0 ? educationItems : undefined
}

function extractEducationItem(
  $: cheerio.CheerioAPI,
  element: cheerio.Cheerio<cheerio.Element>,
): {
  degree?: string
  institution?: string
  date?: string
  description?: string
} {
  const item: {
    degree?: string
    institution?: string
    date?: string
    description?: string
  } = {}

  // Extract degree
  const degreeElement = element.find(".degree, .qualification, .program").first()
  if (degreeElement.length) {
    item.degree = degreeElement.text().trim()
  }

  // Extract institution
  const institutionElement = element.find(".institution, .university, .school, .college").first()
  if (institutionElement.length) {
    item.institution = institutionElement.text().trim()
  }

  // Extract date
  const dateElement = element.find(".date, .period, .year, .graduation-date").first()
  if (dateElement.length) {
    item.date = dateElement.text().trim()
  }

  // Extract description
  const descriptionElement = element.find(".description, .details, .courses, .achievements").first()
  if (descriptionElement.length) {
    item.description = descriptionElement.text().trim()
  }

  return item
}

function extractSkillsList($: cheerio.CheerioAPI, keywords: string[]): string[] | undefined {
  const skills: string[] = []

  // Try to find skills section
  for (const keyword of keywords) {
    // Look for headings containing the keyword
    const headingSelectors = ["h1", "h2", "h3", "h4", "h5", "h6", ".section-heading", ".heading"]

    for (const selector of headingSelectors) {
      const headings = $(selector).filter((_, el) => {
        const text = $(el).text().toLowerCase()
        return text.includes(keyword)
      })

      if (headings.length > 0) {
        const heading = headings.first()
        const currentElement = heading.next()

        // Look for lists of skills
        const skillElements = currentElement.find("li, .skill, .tag, .pill, span")
        if (skillElements.length) {
          skillElements.each((_, el) => {
            const text = $(el).text().trim()
            if (text && !skills.includes(text)) {
              skills.push(text)
            }
          })
        } else {
          // If no list items, try to parse text
          const text = currentElement.text().trim()
          if (text) {
            // Split by common separators
            const skillTexts = text.split(/[,|•:;/]/).map((s) => s.trim())
            for (const skill of skillTexts) {
              if (skill && skill.length > 1 && !skills.includes(skill)) {
                skills.push(skill)
              }
            }
          }
        }

        if (skills.length > 0) {
          return skills
        }
      }
    }
  }

  // Try to extract from the whole page
  $(".skills, .skill-list, .tags, .pills")
    .find("li, .skill, .tag, .pill, span")
    .each((_, el) => {
      const text = $(el).text().trim()
      if (text && !skills.includes(text)) {
        skills.push(text)
      }
    })

  return skills.length > 0 ? skills : undefined
}

function extractCertificationsList($: cheerio.CheerioAPI, keywords: string[]): string[] | undefined {
  const certifications: string[] = []

  // Similar approach as skills extraction
  for (const keyword of keywords) {
    const headingSelectors = ["h1", "h2", "h3", "h4", "h5", "h6", ".section-heading", ".heading"]

    for (const selector of headingSelectors) {
      const headings = $(selector).filter((_, el) => {
        const text = $(el).text().toLowerCase()
        return text.includes(keyword)
      })

      if (headings.length > 0) {
        const heading = headings.first()
        const currentElement = heading.next()

        const certElements = currentElement.find("li, .certification, .certificate")
        if (certElements.length) {
          certElements.each((_, el) => {
            const text = $(el).text().trim()
            if (text && !certifications.includes(text)) {
              certifications.push(text)
            }
          })
        } else {
          const text = currentElement.text().trim()
          if (text) {
            const certTexts = text.split(/[,|•:;/]/).map((s) => s.trim())
            for (const cert of certTexts) {
              if (cert && cert.length > 1 && !certifications.includes(cert)) {
                certifications.push(cert)
              }
            }
          }
        }

        if (certifications.length > 0) {
          return certifications
        }
      }
    }
  }

  // Try to extract from the whole page
  $(".certifications, .certificates, .credentials")
    .find("li, .certification, .certificate")
    .each((_, el) => {
      const text = $(el).text().trim()
      if (text && !certifications.includes(text)) {
        certifications.push(text)
      }
    })

  return certifications.length > 0 ? certifications : undefined
}
