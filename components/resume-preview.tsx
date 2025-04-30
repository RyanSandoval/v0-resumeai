"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Download, SplitSquareVertical, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/components/auth/session-provider"
import { ResumeComparison } from "@/components/resume-comparison"
import { EditableResume } from "@/components/editable-resume"
import { generateOptimizedFile } from "@/lib/file-utils"
import { saveResume } from "@/app/actions/resume-actions"
import { TemplateSelector } from "@/components/template-selector"
import { TemplateRenderer } from "@/components/resume-templates/template-renderer"
import { TemplateProvider } from "@/contexts/template-context"
import type { OptimizationResult, ResumeFile } from "@/components/resume-optimizer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ResumePreviewProps {
  result: OptimizationResult
  resumeFile: ResumeFile
  jobDescription?: string
  onBack: () => void
  onUpdate: (updatedResult: OptimizationResult) => void
  readOnly?: boolean
}

// Function to calculate the match score
const calculateMatchScore = (matched: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((matched / total) * 100)
}

export function ResumePreview({
  result,
  resumeFile,
  jobDescription,
  onBack,
  onUpdate,
  readOnly = false,
}: ResumePreviewProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [showChanges, setShowChanges] = useState(true)
  const [showComparison, setShowComparison] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "docx" | "txt">("pdf")
  const [activeTab, setActiveTab] = useState<"optimized" | "original" | "jobDescription" | "edit" | "template">(
    "optimized",
  )
  const [optimizedText, setOptimizedText] = useState(result.optimizedText)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [resumeTitle, setResumeTitle] = useState("My Optimized Resume")
  const [currentScore, setCurrentScore] = useState(result.score)
  const [currentKeywords, setCurrentKeywords] = useState(result.keywords)
  const [isScoreUpdating, setIsScoreUpdating] = useState(false)

  // Effect to initialize score from result
  useEffect(() => {
    setCurrentScore(result.score)
    setCurrentKeywords(result.keywords)
  }, [result.score, result.keywords])

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
      toast({
        title: "Download failed",
        description: "There was an error generating your file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSaveResume = async () => {
    if (!session?.user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your resume",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const { success, error, resumeId } = await saveResume(
        {
          ...result,
          optimizedText: activeTab === "edit" ? optimizedText : result.optimizedText,
          score: currentScore,
          keywords: currentKeywords,
        },
        resumeTitle,
        window.location.href.includes("?url=")
          ? new URL(window.location.href).searchParams.get("url") || undefined
          : undefined,
      )

      if (success) {
        toast({
          title: "Resume saved",
          description: "Your resume has been saved successfully",
        })
        setSaveDialogOpen(false)
      } else {
        toast({
          title: "Save failed",
          description: error || "There was an error saving your resume",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving resume:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving your resume",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to highlight changes in the optimized text
  const highlightChanges = (text: string) => {
    // Get the original and optimized text as arrays of lines
    const originalLines = result.originalText.split("\n")
    const optimizedLines = text.split("\n")

    // Find added keywords from the result
    const addedKeywords = result.keywords.missing || []

    // Create a map to track which lines have been highlighted
    const highlightedLines = new Set<number>()

    // Check for changes based on the changes array from the result
    result.changes.forEach((change) => {
      // For each change, try to find lines that match the description
      const changeDescription = change.description.toLowerCase()

      optimizedLines.forEach((line, index) => {
        // Check if the line contains any of the missing keywords
        const containsKeyword = addedKeywords.some((keyword) => line.toLowerCase().includes(keyword.toLowerCase()))

        // Check if the line might be related to the change description
        const relatedToChange =
          changeDescription.includes("add") && line.toLowerCase().includes(change.section.toLowerCase())

        // If the line contains a keyword or is related to a change, highlight it
        if (containsKeyword || relatedToChange) {
          highlightedLines.add(index)
        }
      })
    })

    // Highlight lines that are different from the original
    optimizedLines.forEach((line, index) => {
      // If the line doesn't exist in the original or is different, highlight it
      if (index >= originalLines.length || line !== originalLines[index]) {
        highlightedLines.add(index)
      }
    })

    // Return the highlighted text
    return optimizedLines.map((line, index) => (
      <p key={index} className={highlightedLines.has(index) ? "bg-green-100 dark:bg-green-900/30" : ""}>
        {line || <br />}
      </p>
    ))
  }

  // Handle updates from the editable resume
  const handleResumeUpdate = (updatedText: string) => {
    setOptimizedText(updatedText)
    setIsScoreUpdating(true)

    // Extract keywords from job description to recalculate score
    const jobKeywords = extractKeywords(jobDescription || "")

    // Check which keywords are present in the resume
    const matched = jobKeywords.filter((keyword) => updatedText.toLowerCase().includes(keyword.toLowerCase()))

    const missing = jobKeywords.filter((keyword) => !updatedText.toLowerCase().includes(keyword.toLowerCase()))

    // Calculate new score
    const newScore = calculateMatchScore(matched.length, jobKeywords.length)

    // Update local state
    setCurrentScore(newScore)
    setCurrentKeywords({ matched, missing })
    setIsScoreUpdating(false)

    // Update the parent component with the new result
    onUpdate({
      ...result,
      optimizedText: updatedText,
      score: newScore,
      keywords: { matched, missing },
    })
  }

  // Extract keywords from text (simplified version)
  const extractKeywords = (text: string): string[] => {
    if (!text) return []

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
    const wordCounts: Record<string, number> = {}

    filteredWords.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    })

    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])

    return sortedWords.slice(0, 20)
  }

  // Function to format text for display
  const formatTextForDisplay = (text: string) => {
    // Only check for binary/garbled text if the text is very short or contains specific binary markers
    const isBinary =
      (text.length < 50 && /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(text)) ||
      text.substring(0, 10).includes("PK") ||
      text.substring(0, 10).includes("%PDF")

    if (isBinary) {
      return "The file content could not be properly extracted. Please try a different file format or convert your resume to a plain text format."
    }

    return text
  }

  return (
    <TemplateProvider>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="w-full md:w-auto px-5 py-2.5 h-10 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

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
              className="w-full md:w-auto px-5 py-2.5 h-10 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            >
              <SplitSquareVertical className="mr-2 h-4 w-4" />
              {showComparison ? "Hide Analysis" : "Show Analysis"}
            </Button>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={downloadFormat} onValueChange={(value) => setDownloadFormat(value as any)}>
                <SelectTrigger className="w-[100px] h-10">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full md:w-auto px-5 py-2.5 h-10 transition-all duration-200"
              >
                {isDownloading ? (
                  "Generating..."
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>

              {session?.user && !readOnly && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSaveDialogOpen(true)}
                  className="w-full md:w-auto px-5 py-2.5 h-10 transition-all duration-200"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={`grid gap-6 ${showComparison ? "lg:grid-cols-[2fr_1fr]" : ""}`}>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-1">
                  <TabsTrigger value="optimized" className="text-sm py-2">
                    Optimized
                  </TabsTrigger>
                  <TabsTrigger value="original" className="text-sm py-2">
                    Original
                  </TabsTrigger>
                  <TabsTrigger value="jobDescription" className="text-sm py-2">
                    Job Description
                  </TabsTrigger>
                  <TabsTrigger value="template" className="text-sm py-2">
                    Templates
                  </TabsTrigger>
                  {!readOnly && (
                    <TabsTrigger value="edit" className="text-sm py-2">
                      Edit Resume
                    </TabsTrigger>
                  )}
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

                <TabsContent value="template" className="m-0">
                  <div className="border-t p-4 bg-white dark:bg-slate-950 min-h-[500px] max-h-[600px] overflow-y-auto">
                    <div className="mb-6">
                      <TemplateSelector />
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 border rounded-md shadow-sm">
                      <TemplateRenderer resumeText={activeTab === "edit" ? optimizedText : result.optimizedText} />
                    </div>
                  </div>
                </TabsContent>

                {!readOnly && (
                  <TabsContent value="edit" className="m-0">
                    <div className="border-t p-0 bg-white dark:bg-slate-950 w-full">
                      <EditableResume
                        result={{
                          ...result,
                          score: currentScore,
                          keywords: currentKeywords,
                        }}
                        jobDescription={jobDescription || ""}
                        onUpdate={handleResumeUpdate}
                      />
                    </div>
                  </TabsContent>
                )}
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
                        {activeTab === "edit" ? currentScore : result.score}%
                        {isScoreUpdating && (
                          <span className="ml-2 text-xs text-amber-500 animate-pulse">Updating...</span>
                        )}
                      </span>
                    </div>
                    <Progress value={activeTab === "edit" ? currentScore : result.score} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <ResumeComparison
                result={{
                  ...result,
                  score: activeTab === "edit" ? currentScore : result.score,
                  keywords: activeTab === "edit" ? currentKeywords : result.keywords,
                }}
                jobDescription={jobDescription || ""}
              />

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Changes Made</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {result.changes.length > 0 ? (
                      result.changes.map((change, index) => (
                        <div key={index} className="text-sm border-l-2 border-green-500 pl-3 py-1">
                          <span className="font-medium">{change.section}: </span>
                          {change.description}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No specific changes were made to this resume.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Resume</DialogTitle>
              <DialogDescription>Give your resume a title to help you identify it later</DialogDescription>
            </DialogHeader>
            <Input
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              placeholder="Resume Title"
              className="mt-4"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveResume} disabled={isSaving || !resumeTitle.trim()}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Resume
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TemplateProvider>
  )
}
