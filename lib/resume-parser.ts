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

export function parseResumeText(text: string): ResumeData {
  // Default structure
  const resumeData: ResumeData = {
    sections: [],
  }

  // Split the text into lines
  const lines = text.split("\n")

  // Try to extract contact information from the first few lines
  const contactInfoLines = lines.slice(0, Math.min(10, lines.length))

  // Extract name (usually the first line)
  if (lines.length > 0) {
    resumeData.name = lines[0].trim()
  }

  // Extract email
  const emailMatch = contactInfoLines.join(" ").match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i)
  if (emailMatch) {
    resumeData.email = emailMatch[0]
  }

  // Extract phone
  const phoneMatch = contactInfoLines.join(" ").match(/(\+\d{1,3}[-.\s]?)?($$?\d{3}$$?[-.\s]?)?\d{3}[-.\s]?\d{4}/i)
  if (phoneMatch) {
    resumeData.phone = phoneMatch[0]
  }

  // Extract LinkedIn
  const linkedinMatch = contactInfoLines.join(" ").match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i)
  if (linkedinMatch) {
    resumeData.linkedin = linkedinMatch[0]
  }

  // Extract website
  const websiteMatch = contactInfoLines.join(" ").match(/https?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i)
  if (websiteMatch && !websiteMatch[0].includes("linkedin.com")) {
    resumeData.website = websiteMatch[0]
  }

  // Extract location (this is a bit trickier, look for common patterns)
  const locationPatterns = [
    /[A-Za-z\s]+,\s*[A-Z]{2}/i, // City, State
    /[A-Za-z\s]+,\s*[A-Za-z\s]+/i, // City, Country
  ]

  for (const pattern of locationPatterns) {
    const locationMatch = contactInfoLines.join(" ").match(pattern)
    if (locationMatch) {
      resumeData.location = locationMatch[0]
      break
    }
  }

  // Identify sections in the resume
  const sectionTitles = [
    "SUMMARY",
    "PROFILE",
    "OBJECTIVE",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "EDUCATION",
    "ACADEMIC BACKGROUND",
    "SKILLS",
    "TECHNICAL SKILLS",
    "CORE COMPETENCIES",
    "PROJECTS",
    "KEY PROJECTS",
    "CERTIFICATIONS",
    "CERTIFICATES",
    "AWARDS",
    "HONORS",
    "PUBLICATIONS",
    "LANGUAGES",
    "INTERESTS",
    "HOBBIES",
  ]

  let currentSection: ResumeSection | null = null
  let sectionContent: string[] = []

  // Process each line to identify sections and their content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip the first few lines which likely contain contact info
    if (i < 5 && (resumeData.name === line || line === "")) {
      continue
    }

    // Check if this line is a section header
    const isSectionHeader = sectionTitles.some(
      (title) =>
        line.toUpperCase() === title ||
        line.toUpperCase().startsWith(title + ":") ||
        line.toUpperCase().startsWith(title + " "),
    )

    if (isSectionHeader) {
      // Save the previous section if it exists
      if (currentSection && sectionContent.length > 0) {
        currentSection.content = sectionContent.join("\n")
        resumeData.sections.push(currentSection)
        sectionContent = []
      }

      // Start a new section
      currentSection = {
        title: line.replace(/:/g, "").trim(),
        content: "",
      }
    } else if (currentSection && line !== "") {
      // Add content to the current section
      sectionContent.push(line)
    }
  }

  // Add the last section
  if (currentSection && sectionContent.length > 0) {
    currentSection.content = sectionContent.join("\n")
    resumeData.sections.push(currentSection)
  }

  // If no sections were found, create a generic one with all content
  if (resumeData.sections.length === 0 && lines.length > 0) {
    resumeData.sections.push({
      title: "Resume",
      content: lines.slice(1).join("\n"), // Skip the first line (name)
    })
  }

  return resumeData
}
