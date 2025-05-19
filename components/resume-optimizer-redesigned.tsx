"use client"

import { useState, useEffect } from "react"
import type { ResumeData } from "@/types/resume"
import type { OptimizationSettingsType } from "@/types/optimization"
import { optimizeResume } from "@/app/actions/optimize-resume"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import ResumePreview from "./resume-preview"
import ResumeComparison from "./resume-comparison"
import KeywordsInput from "./keywords-input"
import OptimizationSettingsComponent from "./optimization-settings"
import { FileText, Wand2, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

interface ResumeOptimizerProps {
  resumeData: ResumeData
  jobDescription: string
}

export default function ResumeOptimizerRedesigned({ resumeData, jobDescription }: ResumeOptimizerProps) {
  const [keywords, setKeywords] = useState<string[]>([])
  const [settings, setSettings] = useState<OptimizationSettingsType>({
    detailLevel: "balanced",
    prioritySections: ["experience", "skills"],
    keywordDensity: "medium",
  })

  const [optimizing, setOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [optimizationError, setOptimizationError] = useState<string | null>(null)
  const [optimizationResult, setOptimizationResult] = useState<{
    original: ResumeData
    optimized: ResumeData
    changes: any
  } | null>(null)

  const [activeTab, setActiveTab] = useState("original")

  // Extract potential keywords from job description on mount
  useEffect(() => {
    if (jobDescription) {
      const extractedKeywords = extractKeywordsFromJobDescription(jobDescription)
      setKeywords(extractedKeywords)
    }
  }, [jobDescription])

  // Simulate optimization progress
  useEffect(() => {
    if (optimizing) {
      const interval = setInterval(() => {
        setOptimizationProgress((prev) => {
          const newProgress = prev + Math.random() * 10
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 500)

      return () => clearInterval(interval)
    }
  }, [optimizing])

  const handleOptimize = async () => {
    try {
      setOptimizing(true)
      setOptimizationProgress(0)
      setOptimizationError(null)

      const result = await optimizeResume(resumeData, jobDescription, keywords, settings)

      setOptimizationResult(result)
      setActiveTab("comparison")
    } catch (error) {
      console.error("Optimization error:", error)
      setOptimizationError(error.message || "Failed to optimize resume")
    } finally {
      setOptimizing(false)
      setOptimizationProgress(100)
    }
  }

  const handleAcceptChanges = () => {
    // Here you would typically save the optimized resume
    // For now, we'll just show a success message
    alert("Changes accepted! The optimized resume is now your current version.")
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resume Optimizer</h1>
          <p className="text-muted-foreground">
            Tailor your resume to match the job description and increase your chances of getting an interview
          </p>
        </div>

        {!optimizing && !optimizationResult && (
          <Button onClick={handleOptimize} size="lg" className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Optimize Resume
          </Button>
        )}
      </div>

      {optimizationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Optimization Failed</AlertTitle>
          <AlertDescription>{optimizationError}</AlertDescription>
        </Alert>
      )}

      {optimizing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Optimizing Your Resume
            </CardTitle>
            <CardDescription>
              Our AI is analyzing your resume and tailoring it to match the job description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={optimizationProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {optimizationProgress < 100
                ? "This may take a minute..."
                : "Almost done! Finalizing your optimized resume..."}
            </p>
          </CardContent>
        </Card>
      )}

      {!optimizing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {optimizationResult ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="original" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Original
                  </TabsTrigger>
                  <TabsTrigger value="optimized" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Optimized
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Comparison
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="original" className="m-0">
                  <ResumePreview
                    resume={optimizationResult.original}
                    keywords={keywords}
                    title="Original Resume"
                    highlightKeywords={true}
                  />
                </TabsContent>

                <TabsContent value="optimized" className="m-0">
                  <ResumePreview
                    resume={optimizationResult.optimized}
                    keywords={keywords}
                    title="Optimized Resume"
                    highlightKeywords={true}
                  />
                </TabsContent>

                <TabsContent value="comparison" className="m-0">
                  <ResumeComparison
                    original={optimizationResult.original}
                    optimized={optimizationResult.optimized}
                    keywords={keywords}
                    onAcceptChanges={handleAcceptChanges}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <ResumePreview resume={resumeData} keywords={keywords} highlightKeywords={true} />
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Keywords</CardTitle>
                <CardDescription>Add or edit keywords that are relevant to the job</CardDescription>
              </CardHeader>
              <CardContent>
                <KeywordsInput keywords={keywords} onChange={setKeywords} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Settings</CardTitle>
                <CardDescription>Customize how your resume will be optimized</CardDescription>
              </CardHeader>
              <CardContent>
                <OptimizationSettingsComponent settings={settings} onChange={setSettings} />
              </CardContent>
            </Card>

            {!optimizationResult && (
              <Button onClick={handleOptimize} className="w-full flex items-center justify-center gap-2" size="lg">
                <Wand2 className="h-5 w-5" />
                Optimize Resume
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to extract keywords from job description
function extractKeywordsFromJobDescription(jobDescription: string): string[] {
  // This is a simple implementation - in a real app, you'd use NLP or a more sophisticated algorithm
  const commonWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "as",
    "into",
    "like",
    "through",
    "after",
    "over",
    "between",
    "out",
    "against",
    "during",
    "without",
    "before",
    "under",
    "around",
    "among",
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
    "of",
    "that",
    "this",
    "these",
    "those",
    "it",
    "they",
    "we",
    "he",
    "she",
    "who",
    "what",
    "where",
    "when",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "our",
    "your",
    "their",
    "my",
    "his",
    "her",
    "its",
    "ours",
    "yours",
    "theirs",
    "mine",
    "hers",
  ])

  // Extract words, remove punctuation, convert to lowercase
  const words = jobDescription
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.has(word))

  // Count word frequency
  const wordCounts = words.reduce(
    (acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Sort by frequency and take top 15
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
}
