"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientFileProcessor } from "@/components/client-file-processor"
import { JobDescriptionInput } from "@/components/job-description-input"
import { KeywordsInput } from "@/components/keywords-input"
import { OptimizationSettings } from "@/components/optimization-settings"
import { ResumePreview } from "@/components/resume-preview"
import { Progress } from "@/components/ui/progress"
import { analyzeResumeWithAI } from "@/app/actions/optimize-resume"
import { getBaselineResume } from "@/app/actions/baseline-resume-actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BaselineResumeManager } from "@/components/baseline-resume-manager"

export type ResumeFile = {
  file: File
  text: string
  type: string
  processing?: boolean
}

export type OptimizationResult = {
  originalText: string
  optimizedText: string
  jobDescription?: string
  changes: Array<{
    type: "addition" | "modification"
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

export function ResumeOptimizer() {
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

  // Handle file selection with null state
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

  async function handleOptimize() {
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

      // Call the optimization function with AI integration
      const optimizationResult = await analyzeResumeWithAI({
        resumeText: resumeTextToOptimize,
        jobDescription: inputMethod === "jobDescription" ? jobDescription : "",
        keywords: inputMethod === "keywords" ? keywords : [],
        options: optimizationOptions,
      })

      clearInterval(progressInterval)
      setProgress(100)
      setResult(optimizationResult)

      if (optimizationResult.score > 0) {
        toast({
          title: "Optimization complete",
          description: `Your resume has been optimized! Fit rating: ${optimizationResult.fitRating}/10`,
        })
      } else {
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

  // Add this function after the handleOptimize function
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

    return true
  }

  const resetForm = () => {
    setResumeFile(null)
    setUseBaseline(false)
    setJobDescription("")
    setKeywords([])
    setResult(null)
    setProgress(0)
    setOptimizationError(null)
  }

  const handleResultUpdate = (updatedResult: OptimizationResult) => {
    setResult(updatedResult)
  }

  return (
    <div className="w-full mx-auto">
      {!result ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Resume Selection</h2>

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

                  {!useBaseline && (
                    <ClientFileProcessor onFileSelected={handleFileSelected} selectedFile={resumeFile} />
                  )}
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
        <ResumePreview
          result={result}
          resumeFile={
            resumeFile || {
              file: new File([baselineResume!.text], baselineResume!.fileName, { type: "text/plain" }),
              text: baselineResume!.text,
              type: "txt",
            }
          }
          jobDescription={inputMethod === "jobDescription" ? jobDescription : undefined}
          onBack={() => setResult(null)}
          onUpdate={handleResultUpdate}
        />
      )}
    </div>
  )
}
