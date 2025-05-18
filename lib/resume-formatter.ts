import type { ScrapedResumeData } from "@/app/actions/scrape-resume"

export function formatScrapedResumeToText(data: ScrapedResumeData): string {
  let formattedText = ""

  // Add name
  if (data.fullName) {
    formattedText += `${data.fullName.toUpperCase()}\n`
  }

  // Add contact info
  if (data.contactInfo) {
    const contactParts: string[] = []

    if (data.contactInfo.email) {
      contactParts.push(data.contactInfo.email)
    }

    if (data.contactInfo.phone) {
      contactParts.push(data.contactInfo.phone)
    }

    if (data.contactInfo.location) {
      contactParts.push(data.contactInfo.location)
    }

    if (data.contactInfo.linkedin) {
      contactParts.push(data.contactInfo.linkedin)
    }

    if (data.contactInfo.website) {
      contactParts.push(data.contactInfo.website)
    }

    if (contactParts.length > 0) {
      formattedText += `${contactParts.join(" | ")}\n\n`
    }
  }

  // Add summary
  if (data.summary) {
    formattedText += "SUMMARY\n"
    formattedText += `${data.summary}\n\n`
  }

  // Add experience
  if (data.experience && data.experience.length > 0) {
    formattedText += "EXPERIENCE\n"

    data.experience.forEach((job) => {
      if (job.title && job.company) {
        formattedText += `${job.title} | ${job.company}\n`
      } else if (job.title) {
        formattedText += `${job.title}\n`
      } else if (job.company) {
        formattedText += `${job.company}\n`
      }

      if (job.date) {
        formattedText += `${job.date}\n`
      }

      if (job.description && job.description.length > 0) {
        job.description.forEach((desc) => {
          formattedText += `• ${desc}\n`
        })
      }

      formattedText += "\n"
    })
  }

  // Add education
  if (data.education && data.education.length > 0) {
    formattedText += "EDUCATION\n"

    data.education.forEach((edu) => {
      if (edu.degree && edu.institution) {
        formattedText += `${edu.degree} | ${edu.institution}\n`
      } else if (edu.degree) {
        formattedText += `${edu.degree}\n`
      } else if (edu.institution) {
        formattedText += `${edu.institution}\n`
      }

      if (edu.date) {
        formattedText += `${edu.date}\n`
      }

      if (edu.description) {
        formattedText += `${edu.description}\n`
      }

      formattedText += "\n"
    })
  }

  // Add skills
  if (data.skills && data.skills.length > 0) {
    formattedText += "SKILLS\n"
    formattedText += data.skills.join(", ") + "\n\n"
  }

  // Add certifications
  if (data.certifications && data.certifications.length > 0) {
    formattedText += "CERTIFICATIONS\n"
    data.certifications.forEach((cert) => {
      formattedText += `• ${cert}\n`
    })
    formattedText += "\n"
  }

  // If we have no structured data but have raw text, use that as a fallback
  if (formattedText.trim() === "" && data.rawText) {
    return data.rawText
  }

  return formattedText.trim()
}
