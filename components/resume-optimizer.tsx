"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResumeUpload } from "@/components/resume-upload"
import { JobDescriptionInput } from "@/components/job-description-input"
import { KeywordsInput } from "@/components/keywords-input"
import { OptimizationSettings } from "@/components/optimization-settings"
import { ResumePreview } from "@/components/resume-preview"
import { Progress } from "@/components/ui/progress"
import { optimizeResume } from "@/lib/resume-optimizer"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export type ResumeFile = {
  file: File
  text: string
  type: string
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
}

export type OptimizationOptions = {
  detailLevel: "minimal" | "moderate" | "detailed"
  prioritySections: string[]
  preserveFormatting: boolean
  keywordDensity: "low" | "medium" | "high"
}

export function ResumeOptimizer() {
  const [resumeFile, setResumeFile] = useState<ResumeFile | null>(null)
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
  const { toast } = useToast()

  async function handleOptimize() {
    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume first.",
        variant: "destructive",
      })
      return
    }

    // Validate the resume text
    if (!validateResumeText(resumeFile.text)) {
      return
    }

    if (resumeFile.text.length < 50) {
      toast({
        title: "Resume text too short",
        description:
          "The extracted text from your resume is too short. Please try uploading a different file or format.",
        variant: "destructive",
      })
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
      const optimizationResult = await optimizeResume({
        resumeText: resumeFile.text,
        resumeType: resumeFile.type,
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
          description: "Your resume has been optimized!",
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
      toast({
        title: "Optimization failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
    setJobDescription("")
    setKeywords([])
    setResult(null)
    setProgress(0)
  }

  const handleResultUpdate = (updatedResult: OptimizationResult) => {
    setResult(updatedResult)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {!result ? (
        <Card className="shadow-lg border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="space-y-8">
              <ResumeUpload onFileSelected={setResumeFile} selectedFile={resumeFile} />

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

              <OptimizationSettings options={optimizationOptions} onChange={setOptimizationOptions} />

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
                  <Button onClick={handleOptimize} disabled={!resumeFile}>
                    Optimize Resume
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <ResumePreview
          result={result}
          resumeFile={resumeFile!}
          jobDescription={inputMethod === "jobDescription" ? jobDescription : undefined}
          onBack={() => setResult(null)}
          onUpdate={handleResultUpdate}
        />
      )}
    </div>
  )
}
