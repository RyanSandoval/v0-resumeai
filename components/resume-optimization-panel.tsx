"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"
import { analyzeResumeWithGrok, type ResumeAnalysisResult } from "@/app/actions/analyze-resume"
import { useToast } from "@/hooks/use-toast"

interface ResumeOptimizationPanelProps {
  resumeText: string
  jobDescription: string
  onApplySuggestion: (suggestion: string, category?: string, issue?: string) => void
}

export function ResumeOptimizationPanel({
  resumeText,
  jobDescription,
  onApplySuggestion,
}: ResumeOptimizationPanelProps) {
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("recommendations")
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Analyze resume when text changes (with debounce)
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(() => {
      if (resumeText.length > 100) {
        analyzeResume()
      }
    }, 1500) // 1.5 second debounce

    setDebounceTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [resumeText, jobDescription])

  const analyzeResume = async () => {
    if (isAnalyzing) return

    setIsAnalyzing(true)
    try {
      const result = await analyzeResumeWithGrok({
        resumeText,
        jobDescription,
      })

      setAnalysis(result)
    } catch (error) {
      console.error("Error analyzing resume:", error)
      toast({
        title: "Analysis failed",
        description: "Could not analyze your resume. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400"
    if (score >= 70) return "text-blue-600 dark:text-blue-400"
    if (score >= 50) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-600 dark:bg-green-400"
    if (score >= 70) return "bg-blue-600 dark:bg-blue-400"
    if (score >= 50) return "bg-amber-600 dark:bg-amber-400"
    return "bg-red-600 dark:bg-red-400"
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "keywords":
        return "🔑"
      case "formatting":
        return "📝"
      case "content":
        return "📄"
      case "structure":
        return "🏗️"
      case "general":
        return "📌"
      default:
        return "ℹ️"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Resume Optimization</span>
          {analysis && (
            <Button variant="ghost" size="sm" onClick={analyzeResume} disabled={isAnalyzing} className="h-8 px-2">
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1 text-xs">Refresh</span>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAnalyzing && !analysis ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-slate-500">Analyzing your resume...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">ATS Optimization Score</span>
                <span className={`text-xl font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}%</span>
              </div>
              <Progress value={analysis.score} className="h-2" indicatorClassName={getProgressColor(analysis.score)} />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Needs Work</span>
                <span>Optimized</span>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="strengths">Strengths</TabsTrigger>
              </TabsList>

              <TabsContent value="recommendations" className="space-y-3 pt-3">
                {analysis.recommendations.length > 0 ? (
                  analysis.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-md p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <span className="mr-2">{getCategoryIcon(rec.category)}</span>
                          <span className="font-medium text-sm capitalize">{rec.category}</span>
                        </div>
                        <Badge className={getSeverityColor(rec.severity)}>{rec.severity}</Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{rec.issue}</p>
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-sm">{rec.recommendation}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => onApplySuggestion(rec.recommendation, rec.category, rec.issue)}
                      >
                        Apply This Suggestion
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      No recommendations needed! Your resume looks great.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="keywords" className="pt-3">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Suggested Keywords</h4>
                    {analysis.keywordSuggestions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywordSuggestions.map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer dark:bg-blue-900/20 dark:text-blue-400"
                            onClick={() => onApplySuggestion(`Add keyword: ${keyword}`)}
                          >
                            {keyword} +
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No additional keywords needed. Your resume contains all relevant keywords.
                      </p>
                    )}
                  </div>

                  {analysis.formattingIssues.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Formatting Issues</h4>
                      <ul className="space-y-1">
                        {analysis.formattingIssues.map((issue, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="strengths" className="pt-3">
                <h4 className="text-sm font-medium mb-2">Resume Strengths</h4>
                {analysis.strengths.length > 0 ? (
                  <ul className="space-y-1">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    No specific strengths identified. Try adding more detailed content to your resume.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <Button onClick={analyzeResume} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Resume"
              )}
            </Button>
            <p className="text-xs text-slate-500 mt-2">Get AI-powered recommendations to optimize your resume</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
