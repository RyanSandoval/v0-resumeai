"use client"
import type { ResumeData } from "@/types/resume"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { highlightKeywords } from "@/lib/text-utils"
import { Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResumePreviewProps {
  resume: ResumeData
  keywords?: string[]
  title?: string
  highlightKeywords?: boolean
  onDownload?: () => void
  onPrint?: () => void
}

// Export as both named and default export to maintain compatibility
export function ResumePreview({
  resume,
  keywords = [],
  title = "Resume Preview",
  highlightKeywords: shouldHighlight = false,
  onDownload,
  onPrint,
}: ResumePreviewProps) {
  const printResume = () => {
    if (onPrint) {
      onPrint()
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = document.getElementById("resume-preview-content")?.innerHTML

    printWindow.document.write(`
      <html>
        <head>
          <title>Resume</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            h1, h2, h3, h4 { margin-top: 0; }
            .section { margin-bottom: 1.5rem; }
            .company { font-weight: bold; }
            .dates { color: #666; font-style: italic; }
            .skills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
            .skill { background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 4px; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>

        <div className="flex gap-2">
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={printResume} className="flex items-center gap-1">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </CardHeader>

      <CardContent id="resume-preview-content">
        <div className="space-y-6">
          {/* Profile Section */}
          {resume.profile && (
            <div className="section">
              <h3 className="text-lg font-semibold border-b pb-2 mb-3">Profile</h3>
              {shouldHighlight ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: highlightKeywords(resume.profile, keywords),
                  }}
                />
              ) : (
                <p>{resume.profile}</p>
              )}
            </div>
          )}

          {/* Skills Section */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="section">
              <h3 className="text-lg font-semibold border-b pb-2 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <Badge key={index} variant={keywords.includes(skill) && shouldHighlight ? "default" : "outline"}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience Section */}
          {resume.experience && resume.experience.length > 0 && (
            <div className="section">
              <h3 className="text-lg font-semibold border-b pb-2 mb-3">Experience</h3>
              <div className="space-y-4">
                {resume.experience.map((exp, index) => (
                  <div key={index} className="pb-4 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <h4 className="font-medium">
                        {exp.title} at {exp.company}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {exp.startDate} - {exp.endDate}
                      </span>
                    </div>

                    {shouldHighlight ? (
                      <div
                        className="mt-2"
                        dangerouslySetInnerHTML={{
                          __html: highlightKeywords(exp.description || "", keywords),
                        }}
                      />
                    ) : (
                      <p className="mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
          {resume.education && resume.education.length > 0 && (
            <div className="section">
              <h3 className="text-lg font-semibold border-b pb-2 mb-3">Education</h3>
              <div className="space-y-4">
                {resume.education.map((edu, index) => (
                  <div key={index} className="pb-4 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <h4 className="font-medium">
                        {edu.degree} in {edu.field}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {edu.institution}, {edu.graduationDate}
                      </span>
                    </div>

                    {edu.description &&
                      (shouldHighlight ? (
                        <div
                          className="mt-2"
                          dangerouslySetInnerHTML={{
                            __html: highlightKeywords(edu.description, keywords),
                          }}
                        />
                      ) : (
                        <p className="mt-2">{edu.description}</p>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ResumePreview
