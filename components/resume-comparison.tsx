"use client"

import { useState } from "react"
import type { ResumeData } from "@/types/resume"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { highlightDifferences, highlightKeywords, countKeywords } from "@/lib/text-utils"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftRight, Check, FileText, ThumbsUp } from "lucide-react"

interface ResumeComparisonProps {
  original: ResumeData
  optimized: ResumeData
  keywords?: string[]
  onAcceptChanges?: () => void
}

export default function ResumeComparison({
  original,
  optimized,
  keywords = [],
  onAcceptChanges,
}: ResumeComparisonProps) {
  const [activeTab, setActiveTab] = useState("side-by-side")
  const [selectedSection, setSelectedSection] = useState("profile")

  // Count keywords in both versions
  const originalKeywordCounts = countKeywords(JSON.stringify(original), keywords)
  const optimizedKeywordCounts = countKeywords(JSON.stringify(optimized), keywords)

  // Calculate total keyword counts
  const originalTotal = Object.values(originalKeywordCounts).reduce((sum, count) => sum + count, 0)
  const optimizedTotal = Object.values(optimizedKeywordCounts).reduce((sum, count) => sum + count, 0)

  // Calculate improvement percentage
  const keywordImprovement =
    originalTotal > 0
      ? Math.round(((optimizedTotal - originalTotal) / originalTotal) * 100)
      : optimizedTotal > 0
        ? 100
        : 0

  const renderSectionContent = (resume: ResumeData, section: string, highlight = false) => {
    switch (section) {
      case "profile":
        return highlight ? (
          <div dangerouslySetInnerHTML={{ __html: highlightKeywords(resume.profile || "", keywords) }} />
        ) : (
          resume.profile
        )

      case "skills":
        return (
          <div className="flex flex-wrap gap-2">
            {resume.skills?.map((skill, index) => (
              <Badge key={index} variant={keywords.includes(skill) ? "default" : "outline"}>
                {skill}
              </Badge>
            ))}
          </div>
        )

      case "experience":
        return (
          <div className="space-y-4">
            {resume.experience?.map((exp, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <h4 className="font-medium">
                  {exp.title} at {exp.company}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {exp.startDate} - {exp.endDate}
                </p>
                {highlight ? (
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
        )

      case "education":
        return (
          <div className="space-y-4">
            {resume.education?.map((edu, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <h4 className="font-medium">
                  {edu.degree} in {edu.field}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {edu.institution}, {edu.graduationDate}
                </p>
                {edu.description &&
                  (highlight ? (
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
        )

      default:
        return null
    }
  }

  const renderDiffView = (section: string) => {
    let originalContent = ""
    let optimizedContent = ""

    switch (section) {
      case "profile":
        originalContent = original.profile || ""
        optimizedContent = optimized.profile || ""
        break

      case "skills":
        originalContent = original.skills?.join(", ") || ""
        optimizedContent = optimized.skills?.join(", ") || ""
        break

      case "experience":
        originalContent =
          original.experience
            ?.map((exp) => `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n${exp.description}`)
            .join("\n\n") || ""

        optimizedContent =
          optimized.experience
            ?.map((exp) => `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n${exp.description}`)
            .join("\n\n") || ""
        break

      case "education":
        originalContent =
          original.education
            ?.map(
              (edu) =>
                `${edu.degree} in ${edu.field} from ${edu.institution} (${edu.graduationDate})${edu.description ? "\n" + edu.description : ""}`,
            )
            .join("\n\n") || ""

        optimizedContent =
          optimized.education
            ?.map(
              (edu) =>
                `${edu.degree} in ${edu.field} from ${edu.institution} (${edu.graduationDate})${edu.description ? "\n" + edu.description : ""}`,
            )
            .join("\n\n") || ""
        break
    }

    return (
      <div className="whitespace-pre-wrap">
        <div
          dangerouslySetInnerHTML={{
            __html: highlightDifferences(originalContent, optimizedContent),
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Resume Comparison</h2>
          <p className="text-muted-foreground">Compare your original resume with the optimized version</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>+{keywordImprovement}% keyword match</span>
          </div>

          {onAcceptChanges && (
            <Button onClick={onAcceptChanges} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Accept Changes
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant={selectedSection === "profile" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedSection("profile")}
              >
                Profile
              </Button>

              <Button
                variant={selectedSection === "skills" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedSection("skills")}
              >
                Skills
              </Button>

              <Button
                variant={selectedSection === "experience" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedSection("experience")}
              >
                Experience
              </Button>

              <Button
                variant={selectedSection === "education" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedSection("education")}
              >
                Education
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="side-by-side" className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Side by Side
                </TabsTrigger>
                <TabsTrigger value="diff-view" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Changes View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <TabsContent value="side-by-side" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Original</h3>
                  <div className="p-4 border rounded-md bg-gray-50">
                    {renderSectionContent(original, selectedSection, true)}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Optimized</h3>
                  <div className="p-4 border rounded-md bg-green-50">
                    {renderSectionContent(optimized, selectedSection, true)}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diff-view" className="m-0">
              <div className="p-4 border rounded-md">
                <h3 className="font-semibold mb-3">Changes</h3>
                {renderDiffView(selectedSection)}
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
