"use client"

import { useState } from "react"
import { ArrowLeft, Download, SplitSquareVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ResumeComparison } from "@/components/resume-comparison"
import { EditableResume } from "@/components/editable-resume"
import { generateOptimizedFile } from "@/lib/file-utils"
import type { OptimizationResult, ResumeFile } from "@/components/resume-optimizer"

interface ResumePreviewProps {
  result: OptimizationResult
  resumeFile: ResumeFile
  jobDescription?: string
  onBack: () => void
  onUpdate: (updatedResult: OptimizationResult) => void
}

// Function to calculate the match score
const calculateMatchScore = (matched: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((matched / total) * 100)
}

export function ResumePreview({ result, resumeFile, jobDescription, onBack, onUpdate }: ResumePreviewProps) {
  const [showChanges, setShowChanges] = useState(true)
  const [showComparison, setShowComparison] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "txt">("pdf")
  const [activeTab, setActiveTab] = useState<"optimized" | "original" | "jobDescription" | "edit">("optimized")
  const [optimizedText, setOptimizedText] = useState(result.optimizedText)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Generate the file in the selected format
      const optimizedFile = await generateOptimizedFile(
        resumeFile.file,
        activeTab === "edit" ? optimizedText : result.optimizedText,
        downloadFormat,
      )

      // Create a download link
      const url = URL.createObjectURL(optimizedFile)
      const a = document.createElement("a")
      a.href = url
      a.download = optimizedFile.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading file:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Function to highlight changes in the optimized text
  const highlightChanges = (text: string) => {
    // This is a simplified implementation
    // In a real app, we would have more sophisticated diff highlighting
    return text.split("\n").map((line, i) => {
      const isChanged = result.changes.some((change) =>
        line.toLowerCase().includes(change.description.toLowerCase().substring(0, 15)),
      )

      return (
        <p key={i} className={isChanged ? "bg-green-100 dark:bg-green-900/30" : ""}>
          {line || <br />}
        </p>
      )
    })
  }

  // Handle updates from the editable resume
  const handleResumeUpdate = (updatedText: string) => {
    setOptimizedText(updatedText)

    // Update the parent component with the new result
    onUpdate({
      ...result,
      optimizedText: updatedText,
    })
  }

  // Function to format text for display
  const formatTextForDisplay = (text: string) => {
    // Check if text appears to be binary/garbled
    const isBinary =
      /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(text.substring(0, 100)) ||
      text.substring(0, 100).includes("PK") ||
      text.substring(0, 100).includes("PDF")

    if (isBinary) {
      return "The file content could not be properly extracted. Please try a different file format or convert your resume to a plain text format."
    }

    return text
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="w-full md:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch id="show-changes" checked={showChanges} onCheckedChange={setShowChanges} />
            <Label htmlFor="show-changes" className="text-sm">
              {showChanges ? "Hide Changes" : "Show Changes"}
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
            className="w-full md:w-auto"
          >
            <SplitSquareVertical className="mr-2 h-4 w-4" />
            {showComparison ? "Hide Analysis" : "Show Analysis"}
          </Button>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={downloadFormat} onValueChange={(value) => setDownloadFormat(value as any)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
                <SelectItem value="txt">TXT</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" onClick={handleDownload} disabled={isDownloading} className="w-full md:w-auto">
              {isDownloading ? (
                "Generating..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${showComparison ? "lg:grid-cols-[1fr_350px]" : ""}`}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="optimized">Optimized</TabsTrigger>
                <TabsTrigger value="original">Original</TabsTrigger>
                <TabsTrigger value="jobDescription">Job Description</TabsTrigger>
                <TabsTrigger value="edit">Edit Resume</TabsTrigger>
              </TabsList>

              <TabsContent value="optimized" className="m-0">
                <div className="border-t p-4 bg-white dark:bg-slate-950 min-h-[500px] max-h-[600px] overflow-y-auto whitespace-pre-wrap font-mono text-sm">
                  {showChanges ? highlightChanges(result.optimizedText) : formatTextForDisplay(result.optimizedText)}
                </div>
              </TabsContent>

              <TabsContent value="original" className="m-0">
                <div className="border-t p-4 bg-white dark:bg-slate-950 min-h-[500px] max-h-[600px] overflow-y-auto whitespace-pre-wrap font-mono text-sm">
                  {formatTextForDisplay(result.originalText)}
                </div>
              </TabsContent>

              <TabsContent value="jobDescription" className="m-0">
                <div className="border-t p-4 bg-white dark:bg-slate-950 min-h-[500px] max-h-[600px] overflow-y-auto whitespace-pre-wrap font-mono text-sm">
                  {result.jobDescription || "No job description provided. Keywords were used for optimization."}
                </div>
              </TabsContent>

              <TabsContent value="edit" className="m-0">
                <div className="border-t p-0 bg-white dark:bg-slate-950">
                  <EditableResume result={result} jobDescription={jobDescription || ""} onUpdate={handleResumeUpdate} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {showComparison && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Resume Score</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Match Score</span>
                    <span className="font-medium">
                      {activeTab === "edit"
                        ? optimizedText
                          ? calculateMatchScore(
                              result.keywords.matched.length,
                              result.keywords.matched.length + result.keywords.missing.length,
                            )
                          : result.score
                        : result.score}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      activeTab === "edit"
                        ? optimizedText
                          ? calculateMatchScore(
                              result.keywords.matched.length,
                              result.keywords.matched.length + result.keywords.missing.length,
                            )
                          : result.score
                        : result.score
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <ResumeComparison result={result} jobDescription={jobDescription || ""} />

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Changes Made</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {result.changes.map((change, index) => (
                    <div key={index} className="text-sm border-l-2 border-green-500 pl-3 py-1">
                      <span className="font-medium">{change.section}: </span>
                      {change.description}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
