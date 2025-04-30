"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit2 } from "lucide-react"
import { calculateMatchScore } from "@/lib/resume-optimizer"
import { ResumeOptimizationPanel } from "@/components/resume-optimization-panel"
import { useToast } from "@/hooks/use-toast"
import type { OptimizationResult } from "@/components/resume-optimizer"

interface EditableResumeProps {
  result: OptimizationResult
  jobDescription: string
  onUpdate: (updatedText: string) => void
}

export function EditableResume({ result, jobDescription, onUpdate }: EditableResumeProps) {
  const [editableText, setEditableText] = useState(result.optimizedText)
  const [score, setScore] = useState(result.score)
  const [keywords, setKeywords] = useState(result.keywords)
  const [isEditing, setIsEditing] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Update score when text changes
  useEffect(() => {
    // Debounce to avoid too many calculations
    const timer = setTimeout(() => {
      updateScoreAndKeywords(editableText)
    }, 500)

    return () => clearTimeout(timer)
  }, [editableText, jobDescription])

  // Update the score and keywords based on the current text
  const updateScoreAndKeywords = (text: string) => {
    // Extract keywords from job description
    const jobKeywords = extractKeywords(jobDescription)

    // Check which keywords are present in the resume
    const matched = jobKeywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))

    const missing = jobKeywords.filter((keyword) => !text.toLowerCase().includes(keyword.toLowerCase()))

    // Calculate new score
    const newScore = calculateMatchScore(matched.length, jobKeywords.length)

    // Update state
    setScore(newScore)
    setKeywords({ matched, missing })

    // Notify parent component
    onUpdate(text)
  }

  // Extract keywords from text
  const extractKeywords = (text: string): string[] => {
    // Simple keyword extraction - in a real app, this would be more sophisticated
    const words = text.toLowerCase().split(/\W+/)
    const commonWords = new Set([
      "the",
      "and",
      "a",
      "an",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "by",
      "of",
      "from",
      "as",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "shall",
      "should",
      "may",
      "might",
      "must",
      "can",
      "could",
    ])

    const filteredWords = words.filter((word) => word.length > 3 && !commonWords.has(word))

    // Count word frequency
    const wordCounts: Record<string, number> = {}
    filteredWords.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    })

    // Sort by frequency and take top keywords
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])

    // Return top keywords
    return sortedWords.slice(0, 20)
  }

  // Toggle between editing and preview modes
  const toggleEditing = () => {
    setIsEditing(!isEditing)
  }

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableText(e.target.value)
  }

  // Apply a suggestion to the resume text
  const applySuggestion = (suggestion: string, category?: string, issue?: string) => {
    // Make sure we're in editing mode
    if (!isEditing) {
      setIsEditing(true)
      // Give time for the editor to appear before applying changes
      setTimeout(() => applySuggestionToText(suggestion, category, issue), 100)
      return
    }

    applySuggestionToText(suggestion, category, issue)
  }

  // Helper function to apply the suggestion to the text
  const applySuggestionToText = (suggestion: string, category?: string, issue?: string) => {
    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus()
    }

    // Handle keyword suggestions
    if (suggestion.startsWith("Add keyword:")) {
      const keyword = suggestion.replace("Add keyword:", "").trim()
      addKeywordToResume(keyword)
      return
    }

    // Handle formatting suggestions
    if (category === "formatting") {
      applyFormattingFix(issue || "", suggestion)
      return
    }

    // Handle content suggestions
    if (category === "content") {
      applyContentSuggestion(issue || "", suggestion)
      return
    }

    // Handle structure suggestions
    if (category === "structure") {
      applyStructureSuggestion(issue || "", suggestion)
      return
    }

    // For other suggestions, just show a toast with the advice
    toast({
      title: "Suggestion",
      description: suggestion,
    })
  }

  // Add a keyword to the resume
  const addKeywordToResume = (keyword: string) => {
    // For this demo, we'll try to add it to the skills section if we can find it
    const lines = editableText.split("\n")
    const skillsLineIndex = lines.findIndex(
      (line) =>
        line.toLowerCase().includes("skills") ||
        line.toLowerCase().includes("expertise") ||
        line.toLowerCase().includes("competencies"),
    )

    if (skillsLineIndex >= 0) {
      // Find the end of the skills section
      let endOfSkillsSection = skillsLineIndex + 1
      while (
        endOfSkillsSection < lines.length &&
        !lines[endOfSkillsSection].match(/^[A-Z][\w\s]+:?$/) && // Not a new section header
        endOfSkillsSection < skillsLineIndex + 10
      ) {
        // Don't go too far
        endOfSkillsSection++
      }

      // Insert the keyword
      lines.splice(endOfSkillsSection, 0, `• ${keyword}`)
      setEditableText(lines.join("\n"))

      toast({
        title: "Keyword added",
        description: `Added "${keyword}" to your skills section.`,
      })
    } else {
      // If we can't find a skills section, just append to the end
      setEditableText(editableText + `\n\nSkills:\n• ${keyword}`)

      toast({
        title: "Keyword added",
        description: `Added "${keyword}" to a new skills section.`,
      })
    }
  }

  // Apply formatting fixes
  const applyFormattingFix = (issue: string, suggestion: string) => {
    let updatedText = editableText
    let successMessage = "Formatting improved."

    switch (issue) {
      case "Inconsistent spacing between sections":
        // Fix inconsistent spacing
        updatedText = fixSectionSpacing(editableText)
        successMessage = "Section spacing has been standardized."
        break

      case "Inconsistent bullet point formatting":
        // Standardize bullet points
        updatedText = standardizeBulletPoints(editableText)
        successMessage = "Bullet points have been standardized."
        break

      case "Missing clear section headers":
        // Add section headers if missing
        updatedText = addMissingSectionHeaders(editableText)
        successMessage = "Added clear section headers."
        break

      case "Missing or improperly formatted email address":
        // Highlight where email should go
        updatedText = highlightContactInfoSection(editableText)
        successMessage = "Contact section highlighted for your attention."
        break

      case "Missing or inconsistent date formatting":
        // Standardize date formats
        updatedText = standardizeDateFormats(editableText)
        successMessage = "Date formats have been standardized."
        break

      default:
        // General formatting improvement
        updatedText = improveGeneralFormatting(editableText)
        successMessage = "General formatting has been improved."
    }

    setEditableText(updatedText)

    toast({
      title: "Formatting applied",
      description: successMessage,
    })
  }

  // Apply content suggestions
  const applyContentSuggestion = (issue: string, suggestion: string) => {
    let updatedText = editableText
    let successMessage = "Content improved."

    if (issue.includes("action verbs")) {
      // Highlight bullet points that could use action verbs
      updatedText = highlightBulletPointsForActionVerbs(editableText)
      successMessage = "Bullet points that need action verbs have been highlighted."
    } else if (issue.includes("quantifiable")) {
      // Highlight achievements that could use metrics
      updatedText = highlightAchievementsForMetrics(editableText)
      successMessage = "Areas where you can add metrics have been highlighted."
    } else {
      // General content improvement suggestion
      toast({
        title: "Content suggestion",
        description: suggestion,
      })
      return
    }

    setEditableText(updatedText)

    toast({
      title: "Content improvement",
      description: successMessage,
    })
  }

  // Apply structure suggestions
  const applyStructureSuggestion = (issue: string, suggestion: string) => {
    let updatedText = editableText
    let successMessage = "Structure improved."

    if (issue.includes("Missing key sections")) {
      // Add missing sections
      const missingSections = issue.replace("Missing key sections:", "").trim().split(", ")
      updatedText = addMissingSections(editableText, missingSections)
      successMessage = "Added templates for missing sections."
    } else {
      // General structure improvement suggestion
      toast({
        title: "Structure suggestion",
        description: suggestion,
      })
      return
    }

    setEditableText(updatedText)

    toast({
      title: "Structure improvement",
      description: successMessage,
    })
  }

  // Fix inconsistent spacing between sections
  const fixSectionSpacing = (text: string): string => {
    // Identify section headers
    const lines = text.split("\n")
    const sectionHeaderIndices: number[] = []

    // Find potential section headers (capitalized lines followed by content)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.length > 0 && line === line.toUpperCase() && i < lines.length - 1 && lines[i + 1].trim().length > 0) {
        sectionHeaderIndices.push(i)
      }
    }

    // If we found section headers, standardize spacing
    if (sectionHeaderIndices.length > 1) {
      let result: string[] = []
      let lastIndex = 0

      for (const index of sectionHeaderIndices) {
        // Add content up to this section header
        result = result.concat(lines.slice(lastIndex, index))

        // If this isn't the first section, add double spacing
        if (result.length > 0) {
          result.push("")
          result.push("")
        }

        // Add the section header
        result.push(lines[index])
        lastIndex = index + 1
      }

      // Add remaining content
      result = result.concat(lines.slice(lastIndex))

      return result.join("\n")
    }

    // If we couldn't identify section headers, use a more general approach
    return text.replace(/\n{3,}/g, "\n\n")
  }

  // Standardize bullet points
  const standardizeBulletPoints = (text: string): string => {
    // Replace various bullet point styles with a standard bullet
    return text.replace(/^[ \t]*[•\-*–][ \t]*/gm, "• ")
  }

  // Add missing section headers
  const addMissingSectionHeaders = (text: string): string => {
    const sections = ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS"]
    const lowerText = text.toLowerCase()
    let updatedText = text

    for (const section of sections) {
      if (!lowerText.includes(section.toLowerCase())) {
        updatedText += `\n\n${section}\n[Add your ${section.toLowerCase()} here]`
      }
    }

    return updatedText
  }

  // Highlight contact info section
  const highlightContactInfoSection = (text: string): string => {
    const lines = text.split("\n")

    // Look for the contact info section (usually at the top)
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (lines[i].includes("@") || /phone|email|contact/i.test(lines[i])) {
        lines[i] = `${lines[i]} [REVIEW CONTACT INFO HERE]`
        return lines.join("\n")
      }
    }

    // If we couldn't find it, add a suggestion at the top
    return `[ADD CONTACT INFO: Full Name, Email, Phone, LinkedIn]\n\n${text}`
  }

  // Standardize date formats
  const standardizeDateFormats = (text: string): string => {
    // This is a simplified implementation - in a real app, we would use more sophisticated regex
    // to identify and standardize various date formats

    // Standardize "Month Year - Month Year" format
    let updatedText = text.replace(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*(-|–|—|to)\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/gi,
      (match) => {
        // Standardize the format but keep the original dates
        const parts = match.split(/\s*(-|–|—|to)\s*/)
        return `${parts[0]} - ${parts[2]}`
      },
    )

    // Standardize "Month Year - Present" format
    updatedText = updatedText.replace(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*(-|–|—|to)\s*(Present|Current|Now)\b/gi,
      (match) => {
        // Standardize the format but keep the original start date
        const parts = match.split(/\s*(-|–|—|to)\s*/)
        return `${parts[0]} - Present`
      },
    )

    // Standardize "Year - Year" format
    updatedText = updatedText.replace(/\b\d{4}\s*(-|–|—|to)\s*\d{4}\b/gi, (match) => {
      // Standardize the format but keep the original years
      const parts = match.split(/\s*(-|–|—|to)\s*/)
      return `${parts[0]} - ${parts[1]}`
    })

    // Standardize "Year - Present" format
    updatedText = updatedText.replace(/\b\d{4}\s*(-|–|—|to)\s*(Present|Current|Now)\b/gi, (match) => {
      // Standardize the format but keep the original start year
      const parts = match.split(/\s*(-|–|—|to)\s*/)
      return `${parts[0]} - Present`
    })

    return updatedText
  }

  // Improve general formatting
  const improveGeneralFormatting = (text: string): string => {
    // This is a simplified implementation - in a real app, we would use more sophisticated
    // techniques to improve formatting

    // Standardize spacing
    let updatedText = text.replace(/\n{3,}/g, "\n\n")

    // Standardize bullet points
    updatedText = updatedText.replace(/^[ \t]*[•\-*–][ \t]*/gm, "• ")

    // Ensure section headers are capitalized and have consistent spacing
    const commonSections = ["summary", "experience", "education", "skills", "projects", "certifications"]
    for (const section of commonSections) {
      const regex = new RegExp(`^${section}`, "im")
      updatedText = updatedText.replace(regex, section.toUpperCase())
    }

    return updatedText
  }

  // Highlight bullet points that need action verbs
  const highlightBulletPointsForActionVerbs = (text: string): string => {
    const lines = text.split("\n")
    const actionVerbs = [
      "achieved",
      "improved",
      "trained",
      "managed",
      "created",
      "resolved",
      "increased",
      "decreased",
      "developed",
      "implemented",
      "coordinated",
      "generated",
      "delivered",
      "designed",
      "established",
      "maintained",
      "led",
      "organized",
      "provided",
      "reduced",
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
        // Check if the bullet point starts with an action verb
        const words = line.replace(/^[•\-*]\s*/, "").split(/\s+/)
        const firstWord = words[0].toLowerCase().replace(/[,.;:]/, "")

        if (!actionVerbs.includes(firstWord)) {
          lines[i] = `${lines[i]} [ADD ACTION VERB HERE]`
        }
      }
    }

    return lines.join("\n")
  }

  // Highlight achievements that could use metrics
  const highlightAchievementsForMetrics = (text: string): string => {
    const lines = text.split("\n")
    const metricsRegex =
      /\b(\d+%|\d+\s+percent|\$\d+|\d+\s+people|\d+\s+team|\d+\s+members|\d+\s+clients|\d+\s+customers|\d+\s+users|\d+\s+projects)\b/i

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (
        (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) &&
        !metricsRegex.test(line) &&
        (line.includes("manage") ||
          line.includes("increase") ||
          line.includes("improve") ||
          line.includes("reduce") ||
          line.includes("save") ||
          line.includes("achieve"))
      ) {
        lines[i] = `${lines[i]} [ADD METRICS: HOW MUCH/MANY?]`
      }
    }

    return lines.join("\n")
  }

  // Add missing sections
  const addMissingSections = (text: string, missingSections: string[]): string => {
    let updatedText = text

    for (const section of missingSections) {
      const sectionName = section.trim().toUpperCase()
      let sectionTemplate = `\n\n${sectionName}\n`

      switch (section.toLowerCase()) {
        case "summary":
          sectionTemplate +=
            "Experienced professional with expertise in [your field]. Skilled in [key skills] with a proven track record of [achievements]. Seeking to leverage my skills in [target role/industry]."
          break
        case "experience":
          sectionTemplate +=
            "JOB TITLE, COMPANY NAME\nMonth Year - Present\n• Responsibility or achievement\n• Responsibility or achievement\n• Responsibility or achievement"
          break
        case "education":
          sectionTemplate += "DEGREE NAME, UNIVERSITY NAME\nGraduation Year\n• GPA, Honors, Relevant Coursework"
          break
        case "skills":
          sectionTemplate +=
            "• Technical Skills: [List relevant technical skills]\n• Soft Skills: [List relevant soft skills]"
          break
        default:
          sectionTemplate += "[Add your " + section.toLowerCase() + " details here]"
      }

      updatedText += sectionTemplate
    }

    return updatedText
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
          <h2 className="text-xl font-semibold">Edit Your Resume</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEditing}
            className="flex items-center gap-2 px-6 py-2.5 h-10 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          >
            {isEditing ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                <span>Preview</span>
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-1" />
                <span>Edit</span>
              </>
            )}
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardContent className={isEditing ? "p-0" : "p-4"}>
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editableText}
                onChange={handleTextChange}
                className="w-full min-h-[600px] p-4 font-mono text-sm border-0 focus:outline-none focus:ring-0 resize-none"
                placeholder="Edit your resume here..."
              />
            ) : (
              <div className="whitespace-pre-wrap min-h-[600px] max-h-[700px] overflow-y-auto font-mono text-sm">
                {editableText}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Keyword Match Score</h4>
            <div className="flex items-center">
              <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
              <span className="text-slate-500 ml-1">/100</span>
            </div>
          </div>

          <Progress value={score} className="h-2 mb-4" />

          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-medium mb-2">Matched Keywords</h5>
              <div className="flex flex-wrap gap-1">
                {keywords.matched.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  >
                    {keyword}
                  </Badge>
                ))}
                {keywords.matched.length === 0 && (
                  <span className="text-sm text-slate-500">No keywords matched yet</span>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium mb-2">Missing Keywords</h5>
              <div className="flex flex-wrap gap-1">
                {keywords.missing.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                  >
                    {keyword}
                  </Badge>
                ))}
                {keywords.missing.length === 0 && <span className="text-sm text-slate-500">All keywords matched!</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <ResumeOptimizationPanel
          resumeText={editableText}
          jobDescription={jobDescription}
          onApplySuggestion={applySuggestion}
        />
      </div>
    </div>
  )
}

// Helper function to get color based on score
function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 dark:text-green-400"
  if (score >= 70) return "text-blue-600 dark:text-blue-400"
  if (score >= 50) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}
