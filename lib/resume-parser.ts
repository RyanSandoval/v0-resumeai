// Resume parser utility functions
import { normalizeText } from "./text-utils"

interface ResumeSection {
  title: string
  content: string
}

interface ResumeData {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  website?: string
  sections: ResumeSection[]
}

/**
 * Parse resume text and extract structured information
 * @param text The resume text to parse
 * @returns Structured resume data
 */
export function parseResume(text: string): ResumeData {
  // First normalize the text to handle encoding issues
  const normalizedText = normalizeText(text)

  // Split into sections
  const sections = extractSections(normalizedText)

  // Extract contact information
  const contactInfo = extractContactInfo(normalizedText)

  // Extract education
  const education = extractEducation(sections.education || "")

  // Extract experience
  const experience = extractExperience(sections.experience || "")

  // Extract skills
  const skills = extractSkills(sections.skills || "")

  // Default structure
  const resumeData: ResumeData = {
    name: contactInfo.name,
    email: contactInfo.email,
    phone: contactInfo.phone,
    linkedin: contactInfo.linkedin,
    website: "",
    sections: [],
  }

  // Convert extracted sections into ResumeSection format
  for (const [title, content] of Object.entries(sections)) {
    resumeData.sections.push({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      content: content,
    })
  }

  // If no sections were found, create a generic one with all content
  if (resumeData.sections.length === 0 && normalizedText.length > 0) {
    resumeData.sections.push({
      title: "Resume",
      content: normalizedText,
    })
  }

  return resumeData
}

/**
 * Extract sections from resume text
 */
function extractSections(text: string) {
  const sections: Record<string, string> = {}

  // Common section headers
  const sectionHeaders = [
    { name: "summary", patterns: ["summary", "professional summary", "profile", "about me"] },
    { name: "experience", patterns: ["experience", "work experience", "employment history", "work history"] },
    { name: "education", patterns: ["education", "academic background", "educational background"] },
    { name: "skills", patterns: ["skills", "technical skills", "core competencies", "key skills"] },
    { name: "projects", patterns: ["projects", "key projects", "relevant projects"] },
    { name: "certifications", patterns: ["certifications", "certificates", "professional certifications"] },
  ]

  // Split text into lines
  const lines = text.split("\n")

  // Find section boundaries
  let currentSection = ""
  let currentContent: string[] = []

  lines.forEach((line, index) => {
    const trimmedLine = line.trim().toLowerCase()

    // Check if this line is a section header
    let foundHeader = false
    for (const header of sectionHeaders) {
      if (
        header.patterns.some(
          (pattern) => trimmedLine.includes(pattern) && (trimmedLine.length < 30 || trimmedLine === pattern),
        )
      ) {
        // Save previous section content if any
        if (currentSection) {
          sections[currentSection] = currentContent.join("\n")
        }

        // Start new section
        currentSection = header.name
        currentContent = []
        foundHeader = true
        break
      }
    }

    if (!foundHeader && currentSection) {
      currentContent.push(line)
    }
  })

  // Save the last section
  if (currentSection) {
    sections[currentSection] = currentContent.join("\n")
  }

  return sections
}

/**
 * Extract contact information from resume text
 */
function extractContactInfo(text: string) {
  const contactInfo: Record<string, string> = {}

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const emailMatch = text.match(emailRegex)
  if (emailMatch) {
    contactInfo.email = emailMatch[0]
  }

  // Extract phone
  const phoneRegex = /\b(\+\d{1,2}\s?)?$$?\d{3}$$?[\s.-]?\d{3}[\s.-]?\d{4}\b/
  const phoneMatch = text.match(phoneRegex)
  if (phoneMatch) {
    contactInfo.phone = phoneMatch[0]
  }

  // Extract LinkedIn
  const linkedinRegex = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/
  const linkedinMatch = text.match(linkedinRegex)
  if (linkedinMatch) {
    contactInfo.linkedin = linkedinMatch[0]
  }

  // Extract name (first 2-3 words at the beginning if they look like a name)
  const firstLine = text.split("\n")[0].trim()
  if (firstLine && firstLine.length < 50 && !/[0-9@]/.test(firstLine)) {
    contactInfo.name = firstLine
  }

  return contactInfo
}

/**
 * Extract education information
 */
function extractEducation(educationText: string) {
  if (!educationText) return []

  const education = []
  const lines = educationText.split("\n")
  let currentEducation: Record<string, string> = {}

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Check for degree/institution patterns
    if (/university|college|school|institute|academy/i.test(trimmedLine)) {
      // If we already have an education entry, save it
      if (Object.keys(currentEducation).length > 0) {
        education.push(currentEducation)
      }

      currentEducation = { institution: trimmedLine }
    }
    // Check for degree
    else if (/bachelor|master|phd|mba|degree|diploma|certificate/i.test(trimmedLine)) {
      currentEducation.degree = trimmedLine
    }
    // Check for graduation date
    else if (/\b(19|20)\d{2}\b/.test(trimmedLine)) {
      currentEducation.date = trimmedLine
    }
    // Otherwise add as description
    else if (Object.keys(currentEducation).length > 0) {
      currentEducation.description = (currentEducation.description || "") + trimmedLine + "\n"
    }
  }

  // Add the last education entry
  if (Object.keys(currentEducation).length > 0) {
    education.push(currentEducation)
  }

  return education
}

/**
 * Extract experience information
 */
function extractExperience(experienceText: string) {
  if (!experienceText) return []

  const experience = []
  const lines = experienceText.split("\n")
  let currentExperience: Record<string, string> = {}

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Check for company/title patterns
    if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b.*\d{4}/i.test(trimmedLine)) {
      // If we already have an experience entry, save it
      if (Object.keys(currentExperience).length > 0) {
        experience.push(currentExperience)
      }

      currentExperience = { date: trimmedLine }
    }
    // Check for job title
    else if (
      trimmedLine.length < 60 &&
      /manager|director|engineer|developer|analyst|specialist|coordinator/i.test(trimmedLine)
    ) {
      currentExperience.title = trimmedLine
    }
    // Check for company name
    else if (trimmedLine.length < 60 && !trimmedLine.startsWith("•") && !trimmedLine.startsWith("-")) {
      currentExperience.company = trimmedLine
    }
    // Otherwise add as description
    else if (Object.keys(currentExperience).length > 0) {
      currentExperience.description = (currentExperience.description || "") + trimmedLine + "\n"
    }
  }

  // Add the last experience entry
  if (Object.keys(currentExperience).length > 0) {
    experience.push(currentExperience)
  }

  return experience
}

/**
 * Extract skills
 */
function extractSkills(skillsText: string) {
  if (!skillsText) return []

  const skills = []

  // Look for bullet points or comma-separated lists
  const bulletRegex = /[•\-*]\s*([^•\-*\n]+)/g
  let match

  while ((match = bulletRegex.exec(skillsText)) !== null) {
    skills.push(match[1].trim())
  }

  // If no bullet points found, try comma separation
  if (skills.length === 0) {
    const commaSkills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    skills.push(...commaSkills)
  }

  return skills
}
