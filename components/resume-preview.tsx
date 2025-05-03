"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditableResume } from "@/components/editable-resume"
import { ResumeChanges } from "@/components/resume-changes"
import { KeywordAnalysis } from "@/components/keyword-analysis"
import { ArrowLeft, Download, Save, Star } from "lucide-react"
import { saveResume } from "@/app/actions/resume-actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { OptimizationResult, ResumeFile } from "@/components/resume-optimizer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FollowupQuestions } from "@/components/followup-questions"

interface ResumePreviewProps {
  result: OptimizationResult
  resumeFile: ResumeFile
  jobDescription?: string
  onBack: () => void
  onUpdate: (updatedResult: OptimizationResult) => void
}

export function ResumePreview({ result, resumeFile, jobDescription, onBack, onUpdate }: ResumePreviewProps) {
  const [activeTab, setActiveTab] = useState("optimized")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSaveResume = async () => {
    try {
      setIsSaving(true)
      const saveResult = await saveResume(result, "Optimized Resume", resumeFile.file.name)

      if (saveResult.success) {
        toast({
          title: "Resume saved",
          description: "Your optimized resume has been saved successfully.",
        })
        router.push(`/resume/${saveResult.resumeId}`)
      } else {
        toast({
          title: "Error saving resume",
          description: saveResult.error || "An unknown error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving resume:", error)
      toast({
        title: "Error saving resume",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([result.optimizedText], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "optimized-resume.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    toast({
      title: "Resume downloaded",
      description: "Your optimized resume has been downloaded as a text file.",
    })
  }

  const handleTextUpdate = (updatedText: string) => {
    const updatedResult = {
      ...result,
      optimizedText: updatedText,
    }
    onUpdate(updatedResult)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Editor
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleSaveResume} disabled={isSaving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Resume"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Resume Optimization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="optimized">Optimized Resume</TabsTrigger>
                <TabsTrigger value="original">Original Resume</TabsTrigger>
              </TabsList>
              <TabsContent value="optimized" className="pt-4">
                {jobDescription ? (
                  <EditableResume result={result} jobDescription={jobDescription} onUpdate={handleTextUpdate} />
                ) : (
                  <pre className="whitespace-pre-wrap p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto">
                    {result.optimizedText}
                  </pre>
                )}
              </TabsContent>
              <TabsContent value="original" className="pt-4">
                <pre className="whitespace-pre-wrap p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto">
                  {result.originalText}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result.fitRating !== undefined && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Job Fit Rating</span>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-1">{result.fitRating}</span>
                    <span className="text-sm text-muted-foreground">/10</span>
                    <Star className="h-5 w-5 ml-1 text-amber-500 fill-amber-500" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className={`${getFitRatingColor(result.fitRating || 0)}`}>
                  <AlertTitle>{getFitRatingMessage(result.fitRating || 0)}</AlertTitle>
                  <AlertDescription>{getFitRatingDescription(result.fitRating || 0)}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Changes Made</CardTitle>
            </CardHeader>
            <CardContent>
              <ResumeChanges changes={result.changes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Keyword Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <KeywordAnalysis
                matched={result.keywords.matched}
                missing={result.keywords.missing}
                score={result.score}
              />
            </CardContent>
          </Card>

          {result.followupQuestions && result.followupQuestions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Follow-up Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <FollowupQuestions questions={result.followupQuestions} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function getFitRatingColor(rating: number): string {
  if (rating >= 8) return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/30"
  if (rating >= 6) return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/30"
  if (rating >= 4) return "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30"
  return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/30"
}

function getFitRatingMessage(rating: number): string {
  if (rating >= 8) return "Excellent Match"
  if (rating >= 6) return "Good Match"
  if (rating >= 4) return "Moderate Match"
  return "Low Match"
}

function getFitRatingDescription(rating: number): string {
  if (rating >= 8) {
    return "Your resume is very well aligned with this job. You appear to be a strong candidate."
  }
  if (rating >= 6) {
    return "Your resume matches many of the job requirements. With some adjustments, you could be a strong candidate."
  }
  if (rating >= 4) {
    return "Your resume partially matches the job requirements. Consider addressing the missing keywords and skills."
  }
  return "Your resume needs significant improvements to match this job. Focus on adding the missing keywords and skills."
}
