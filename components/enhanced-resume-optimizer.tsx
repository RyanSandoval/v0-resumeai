"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EnhancedFileUpload, type ResumeFile } from "@/components/enhanced-file-upload"
import { EnhancedResumeEditor } from "@/components/enhanced-resume-editor"
import { JobDescriptionInput } from "@/components/job-description-input"
import { KeywordsInput } from "@/components/keywords-input"
import { OptimizationSettings } from "@/components/optimization-settings"
import { BaselineResumeManager } from "@/components/baseline-resume-manager"
import { resumeAnalysisService } from "@/lib/services/resume-analysis-service"
import { getBaselineResume, saveOptimizedResume } from "@/app/actions/baseline-resume-actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, FileText, ArrowLeft, Download } from "lucide-react"

export type OptimizationResult = {
  originalText: string
  optimizedText: string
  jobDescription?: string
  changes: Array<{
    type: "addition" | "modification" | "removal"
    section: string
    description: string
  }>
  keywords: {
    matched: string[]
    missing: string[]
  }
  score: number
  fitRating?: number
  followupQuestions?: string[]
}

export type OptimizationOptions = {
  detailLevel: "minimal" | "moderate" | "detailed"
  prioritySections: string[]
  preserveFormatting: boolean
  keywordDensity: "low" | "medium" | "high"
}

export function EnhancedResumeOptimizer() {
  // State
  const [resumeFile, setResumeFile] = useState<ResumeFile | null>(null)
  const [baselineResume, setBaselineResume] = useState<{ text: string; fileName: string } | null>(null)
  const [useBaseline, setUseBaseline] = useState(false)
  const [jobDescription, setJobDescription] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [inputMethod, setInputMethod] = useState<"jobDescription" | "keywords">("jobDescription")
  const [optimizationOptions, setOptimizationOptions] = useState<OptimizationOptions>({
    detailLevel: "moderate",
    prioritySections: ["experience", "skills", "education"],
    preserveFormatting: true,
    keywordDensity: "medium",
  })
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [optimizationError, setOptimizationError] = useState<string | null>(null)
  const [isLoadingBaseline, setIsLoadingBaseline] = useState(true)
  const [optimizationMetadata, setOptimizationMetadata] = useState<any>(null)

  // Hooks
  const { toast } = useToast()

  // Load baseline resume on component mount
  useEffect(() => {
    async function loadBaselineResume() {
      try {
        setIsLoadingBaseline(true)
        const result = await getBaselineResume()
        if (result.success && result.resume) {
          setBaselineResume({
            text: result.resume.resumeText,
            fileName: result.resume.fileName,
          })
        }
      } catch (error) {
        console.error("Error loading baseline resume:", error)
      } finally {
        setIsLoadingBaseline(false)
      }
    }

    loadBaselineResume()
  }, [])

  // Handle file selection
  const handleFileSelected = (file: ResumeFile | null) => {
    setResumeFile(file)
    // Reset optimization if file is removed
    if (!file && result) {
      setResult(null)
    }
    // If a file is selected, disable baseline
    if (file) {
      setUseBaseline(false)
    }
  }

  // Toggle using baseline resume
  const handleToggleBaseline = () => {
    if (!baselineResume) {
      toast({
        title: "No baseline resume",
        description: "Please upload a baseline resume first.",
        variant: "destructive",
      })
      return
    }

    setUseBaseline(!useBaseline)
    if (!useBaseline) {
      // Switching to baseline, clear uploaded file
      setResumeFile(null)
    }
  }

  // Handle optimization
  const handleOptimize = async () => {
    // Check if we have a resume to optimize
    if (!resumeFile && !useBaseline) {
      toast({
        title: "Resume required",
        description: "Please upload your resume or use your baseline resume.",
        variant: "destructive",
      })
      return
    }

    // Get the resume text to optimize
    const resumeTextToOptimize = useBaseline ? baselineResume!.text : resumeFile!.text

    // Validate the resume text
    if (!validateResumeText(resumeTextToOptimize)) {
      return
    }

    if (inputMethod === "jobDescription" && !jobDescription) {
      toast({
        title: "Job description required",
        description: "Please enter a job description or switch to keywords mode.",
        variant: "destructive",
      })
      return
    }

    if (inputMethod === "keywords" && keywords.length === 0) {
      toast({
        title: "Keywords required",
        description: "Please enter at least one keyword or switch to job description mode.",
        variant: "destructive",
      })
      return
    }

    setIsOptimizing(true)
    setProgress(0)
    setOptimizationError(null)
    setOptimizationMetadata(null)

    try {
      // Show progress updates while waiting for AI
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          // AI processing might take longer, so slow down the progress
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5
          const newProgress = prev + Math.random() * increment
          return newProgress >= 95 ? 95 : newProgress // Cap at 95% until complete
        })
      }, 800)

      // Call the optimization service
      const response = await resumeAnalysisService.analyzeResume({
        resumeText: resumeTextToOptimize,
        jobDescription: inputMethod === "jobDescription" ? jobDescription : "",
        keywords: inputMethod === "keywords" ? keywords : [],
        options: optimizationOptions,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (response.success && response.result) {
        setResult(response.result)
        setOptimizationMetadata(response.metadata)

        toast({
          title: "Optimization complete",
          description: `Your resume has been optimized! Fit rating: ${response.result.fitRating}/10`,
        })
      } else {
        // Handle partial success (fallback result)
        setResult(response.result)
        setOptimizationError(
          "Optimization completed with limited functionality. Some features may not work as expected.",
        )
        setOptimizationMetadata(response.metadata)

        toast({
          title: "Optimization completed with issues",
          description: "Some features may be limited. Please try again or adjust your inputs.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setProgress(0)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setOptimizationError(errorMessage)

      toast({
        title: "Optimization failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  // Validate resume text
  const validateResumeText = (text: string): boolean => {
    // Check if text is too short
    if (!text || text.length < 100) {
      toast({
        title: "Resume text too short",
        description:
          "The extracted text from your resume is too short. Please try uploading a different file or format.",
        variant: "destructive",
      })
      return false
    }

    // Check if text contains only special characters or numbers
    const alphaContent = text.replace(/[^a-zA-Z]/g, "")
    if (alphaContent.length < 50) {
      toast({
        title: "Invalid resume content",
        description: "The resume doesn't appear to contain enough text content. Please check the file and try again.",
        variant: "destructive",
      })
      return false
    }

    // Check for garbled text (common with DOCX parsing issues)
    const unusualCharCount = (text.match(/[^\x20-\x7E\n\r\t]/g) || []).length
    if (unusualCharCount > text.length * 0.15) {
      toast({
        title: "Parsing issue detected",
        description: "The resume contains unusual characters. Try uploading in a different format (PDF or TXT).",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Reset form
  const resetForm = () => {
    setResumeFile(null)
    setUseBaseline(false)
    setJobDescription("")
    setKeywords([])
    setResult(null)
    setProgress(0)
    setOptimizationError(null)
    setOptimizationMetadata(null)
  }

  // Handle result update
  const handleResultUpdate = (updatedText: string) => {
    if (result) {
      setResult({
        ...result,
        optimizedText: updatedText,
      })
    }
  }

  // Handle save optimized resume
  const handleSaveOptimizedResume = async (text: string): Promise<boolean> => {
    try {
      if (!result) return false

      const fileName = useBaseline
        ? baselineResume?.fileName || "optimized-resume.txt"
        : resumeFile?.file.name || "optimized-resume.txt"

      const response = await saveOptimizedResume({
        resumeText: text,
        fileName,
        originalText: result.originalText,
        jobDescription: result.jobDescription || "",
      })

      return response.success
    } catch (error) {
      console.error("Error saving optimized resume:", error)
      return false
    }
  }

  // Handle back button
  const handleBack = () => {
    setResult(null)
  }

  // Handle download
  const handleDownload = () => {
    if (!result) return

    try {
      // Create a blob with the optimized text
      const blob = new Blob([result.optimizedText], { type: "text/plain" })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "optimized-resume.txt"

      // Trigger download
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: "Your optimized resume is being downloaded.",
      })
    } catch (error) {
      console.error("Error downloading resume:", error)
      toast({
        title: "Download failed",
        description: "Failed to download resume. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-full mx-auto">
      {!result ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Resume Selection</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {!isLoadingBaseline && baselineResume && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          id="use-baseline"
                          checked={useBaseline}
                          onChange={handleToggleBaseline}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="use-baseline" className="text-sm font-medium">
                          Use my baseline resume
                        </label>
                      </div>

                      {useBaseline && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{baselineResume.fileName}</p>
                            <p className="text-xs text-muted-foreground">{baselineResume.text.length} characters</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!useBaseline && <EnhancedFileUpload onFileSelected={handleFileSelected} selectedFile={resumeFile} />}
                </div>
              </CardContent>
            </Card>

            <BaselineResumeManager />
          </div>

          {optimizationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Optimization Error</AlertTitle>
              <AlertDescription>{optimizationError}</AlertDescription>
            </Alert>
          )}

          <Card className="shadow-lg border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="jobDescription">Job Description</TabsTrigger>
                  <TabsTrigger value="keywords">Keywords</TabsTrigger>
                </TabsList>
                <TabsContent value="jobDescription">
                  <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
                </TabsContent>
                <TabsContent value="keywords">
                  <KeywordsInput keywords={keywords} onChange={setKeywords} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <OptimizationSettings options={optimizationOptions} onChange={setOptimizationOptions} />
            </CardContent>
          </Card>

          {isOptimizing ? (
            <div className="space-y-4">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-center gap-2 text-sm text-center text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Optimizing your resume... {Math.round(progress)}%</p>
              </div>
              <p className="text-xs text-center text-slate-400">
                This may take up to a minute as we analyze your resume and the job description.
              </p>
            </div>
          ) : (
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button
                onClick={handleOptimize}
                disabled={
                  (!resumeFile && !useBaseline) ||
                  (inputMethod === "jobDescription" && !jobDescription) ||
                  (inputMethod === "keywords" && keywords.length === 0)
                }
              >
                Optimize Resume
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {optimizationMetadata && (
            <div className="text-xs text-muted-foreground">
              Processed in {Math.round(optimizationMetadata.processingTime)}ms using {optimizationMetadata.modelUsed}
              {optimizationMetadata.promptTokens &&
                ` (${optimizationMetadata.promptTokens} prompt tokens, ${optimizationMetadata.completionTokens} completion tokens)`}
            </div>
          )}

          <EnhancedResumeEditor
            result={result}
            jobDescription={result.jobDescription || ""}
            onUpdate={handleResultUpdate}
            onSave={handleSaveOptimizedResume}
          />
        </div>
      )}
    </div>
  )
}
