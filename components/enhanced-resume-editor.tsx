"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Edit2, Save, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react"
import { calculateMatchScore } from "@/lib/resume-optimizer"
import { useToast } from "@/hooks/use-toast"
import type { OptimizationResult } from "@/components/resume-optimizer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EnhancedResumeEditorProps {
  result: OptimizationResult
  jobDescription: string
  onUpdate: (updatedText: string) => void
  onSave?: (text: string) => Promise<boolean>
}

export function EnhancedResumeEditor({ result, jobDescription, onUpdate, onSave }: EnhancedResumeEditorProps) {
  // State
  const [editableText, setEditableText] = useState(result.optimizedText)
  const [originalText, setOriginalText] = useState(result.originalText)
  const [score, setScore] = useState(result.score)
  const [keywords, setKeywords] = useState(result.keywords)
  const [isEditing, setIsEditing] = useState(true)
  const [viewMode, setViewMode] = useState<"optimized" | "original" | "diff">("optimized")
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())
  const [pendingUpdate, setPendingUpdate] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Reset state when result changes
  useEffect(() => {
    setEditableText(result.optimizedText)
    setOriginalText(result.originalText)
    setScore(result.score)
    setKeywords(result.keywords)
    setPendingUpdate(false)
    setSaveError(null)
    setSaveSuccess(false)
  }, [result])

  // Memoize the keyword extraction function to improve performance
  const extractKeywords = useCallback((text: string): string[] => {
    // Common words to filter out
    const commonWords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "is",
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
    ])

    // Extract words, normalize, and count frequency
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.has(word))

    const wordCounts: Record<string, number> = {}
    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1
    })

    // Sort by frequency and take top keywords
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word)
  }, [])

  // Memoize the score and keywords update function
  const updateScoreAndKeywords = useCallback(
    (text: string) => {
      try {
        // Extract keywords from job description
        const jobKeywords = extractKeywords(jobDescription)

        // Check which keywords are present in the resume
        const matched = jobKeywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))

        const missing = jobKeywords.filter((keyword) => !text.toLowerCase().includes(keyword.toLowerCase()))

        // Calculate new score
        const newScore = calculateMatchScore(matched.length, jobKeywords.length)

        // Update state
        setScore(newScore)
        setKeywords({ matched, missing })
        setPendingUpdate(false)
        setLastUpdateTime(Date.now())

        // Notify parent component
        onUpdate(text)
      } catch (error) {
        console.error("Error updating score and keywords:", error)
        toast({
          title: "Update Error",
          description: "Failed to update score and keywords. Please try again.",
          variant: "destructive",
        })
      }
    },
    [jobDescription, extractKeywords, onUpdate, toast],
  )

  // Update score when text changes with improved debouncing
  useEffect(() => {
    if (!editableText) return

    // Mark that we have a pending update
    setPendingUpdate(true)

    // Use a shorter delay for better responsiveness
    const timer = setTimeout(() => {
      updateScoreAndKeywords(editableText)
    }, 300)

    return () => clearTimeout(timer)
  }, [editableText, updateScoreAndKeywords])

  // Force update if too much time has passed with a pending update
  useEffect(() => {
    if (!pendingUpdate) return

    // If we have a pending update for more than 2 seconds, force an update
    const forceUpdateTimer = setTimeout(() => {
      if (pendingUpdate) {
        updateScoreAndKeywords(editableText)
      }
    }, 2000)

    return () => clearTimeout(forceUpdateTimer)
  }, [pendingUpdate, editableText, updateScoreAndKeywords])

  // Toggle between editing and preview modes
  const toggleEditing = () => {
    // If we have pending updates, apply them before toggling
    if (pendingUpdate) {
      updateScoreAndKeywords(editableText)
    }
    setIsEditing(!isEditing)
  }

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableText(e.target.value)
    // Reset save status when text changes
    setSaveSuccess(false)
    setSaveError(null)
  }

  // Handle save
  const handleSave = async () => {
    if (!onSave) return

    try {
      setIsSaving(true)
      setSaveError(null)

      // If we have pending updates, apply them before saving
      if (pendingUpdate) {
        updateScoreAndKeywords(editableText)
      }

      const success = await onSave(editableText)

      if (success) {
        setSaveSuccess(true)
        toast({
          title: "Resume Saved",
          description: "Your resume has been saved successfully.",
        })
      } else {
        setSaveError("Failed to save resume. Please try again.")
        toast({
          title: "Save Failed",
          description: "Failed to save resume. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving resume:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setSaveError(`Failed to save resume: ${errorMessage}`)
      toast({
        title: "Save Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset to original text
  const resetToOriginal = () => {
    if (window.confirm("Are you sure you want to reset to the original resume? All changes will be lost.")) {
      setEditableText(originalText)
      updateScoreAndKeywords(originalText)
      toast({
        title: "Reset Complete",
        description: "Your resume has been reset to the original version.",
      })
    }
  }

  // Reset to optimized text
  const resetToOptimized = () => {
    if (window.confirm("Are you sure you want to reset to the optimized resume? All changes will be lost.")) {
      setEditableText(result.optimizedText)
      updateScoreAndKeywords(result.optimizedText)
      toast({
        title: "Reset Complete",
        description: "Your resume has been reset to the optimized version.",
      })
    }
  }

  // Render diff view
  const renderDiffView = () => {
    // Simple diff implementation - in a real app, you'd use a proper diff library
    const originalLines = originalText.split("\n")
    const optimizedLines = result.optimizedText.split("\n")

    // Find added, removed, and unchanged lines
    const diff: Array<{ text: string; type: "added" | "removed" | "unchanged" }> = []

    // Use a simple longest common subsequence approach
    const lcs = findLongestCommonSubsequence(originalLines, optimizedLines)

    let originalIndex = 0
    let optimizedIndex = 0

    for (const i of lcs) {
      // Add removed lines
      while (originalIndex < i[0]) {
        diff.push({
          text: originalLines[originalIndex],
          type: "removed",
        })
        originalIndex++
      }

      // Add added lines
      while (optimizedIndex < i[1]) {
        diff.push({
          text: optimizedLines[optimizedIndex],
          type: "added",
        })
        optimizedIndex++
      }

      // Add unchanged line
      diff.push({
        text: originalLines[originalIndex],
        type: "unchanged",
      })

      originalIndex++
      optimizedIndex++
    }

    // Add remaining removed lines
    while (originalIndex < originalLines.length) {
      diff.push({
        text: originalLines[originalIndex],
        type: "removed",
      })
      originalIndex++
    }

    // Add remaining added lines
    while (optimizedIndex < optimizedLines.length) {
      diff.push({
        text: optimizedLines[optimizedIndex],
        type: "added",
      })
      optimizedIndex++
    }

    return (
      <div className="whitespace-pre-wrap font-mono text-sm">
        {diff.map((line, index) => (
          <div
            key={index}
            className={`${
              line.type === "added"
                ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                : line.type === "removed"
                  ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                  : ""
            }`}
          >
            <span className="mr-2">{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}</span>
            {line.text}
          </div>
        ))}
      </div>
    )
  }

  // Helper function to find longest common subsequence
  const findLongestCommonSubsequence = (a: string[], b: string[]): Array<[number, number]> => {
    const matrix: number[][] = Array(a.length + 1)
      .fill(0)
      .map(() => Array(b.length + 1).fill(0))

    // Fill the matrix
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1])
        }
      }
    }

    // Backtrack to find the sequence
    const sequence: Array<[number, number]> = []
    let i = a.length
    let j = b.length

    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        sequence.unshift([i - 1, j - 1])
        i--
        j--
      } else if (matrix[i - 1][j] > matrix[i][j - 1]) {
        i--
      } else {
        j--
      }
    }

    return sequence
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold">Resume Editor</h2>

        <div className="flex flex-wrap items-center gap-2">
          {onSave && (
            <Button onClick={handleSave} disabled={isSaving || pendingUpdate} className="flex items-center gap-2">
              {isSaving ? (
                <>
                  <span className="animate-spin">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </>
              )}
            </Button>
          )}

          <Button variant="outline" onClick={resetToOptimized} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Optimized</span>
          </Button>

          <Button variant="outline" size="sm" onClick={toggleEditing} className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {saveError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Save Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Resume Saved</AlertTitle>
          <AlertDescription>Your resume has been saved successfully.</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <textarea
              ref={textareaRef}
              value={editableText}
              onChange={handleTextChange}
              className="w-full min-h-[600px] p-4 font-mono text-sm border-0 focus:outline-none focus:ring-0 resize-none"
              placeholder="Edit your resume here..."
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Tabs defaultValue="optimized" value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="optimized">Optimized</TabsTrigger>
                <TabsTrigger value="original">Original</TabsTrigger>
                <TabsTrigger value="diff">Changes</TabsTrigger>
              </TabsList>

              <div className="p-4">
                <TabsContent value="optimized" className="m-0">
                  <div className="whitespace-pre-wrap min-h-[600px] max-h-[700px] overflow-y-auto font-mono text-sm">
                    {editableText}
                  </div>
                </TabsContent>

                <TabsContent value="original" className="m-0">
                  <div className="whitespace-pre-wrap min-h-[600px] max-h-[700px] overflow-y-auto font-mono text-sm">
                    {originalText}
                  </div>
                </TabsContent>

                <TabsContent value="diff" className="m-0">
                  <div className="min-h-[600px] max-h-[700px] overflow-y-auto">{renderDiffView()}</div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Keyword Match Score</h4>
          <div className="flex items-center">
            <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-slate-500 ml-1">/100</span>
            {pendingUpdate && <span className="ml-2 text-xs text-amber-500 animate-pulse">Updating...</span>}
          </div>
        </div>

        <Progress value={score} className="h-2 mb-4" />

        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium mb-2">Matched Keywords</h5>
            <div className="flex flex-wrap gap-1">
              {keywords.matched.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="outline"
                  className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                >
                  {keyword}
                </Badge>
              ))}
              {keywords.matched.length === 0 && <span className="text-sm text-slate-500">No keywords matched yet</span>}
            </div>
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Missing Keywords</h5>
            <div className="flex flex-wrap gap-1">
              {keywords.missing.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="outline"
                  className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  {keyword}
                </Badge>
              ))}
              {keywords.missing.length === 0 && <span className="text-sm text-slate-500">All keywords matched!</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get color based on score
function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 dark:text-green-400"
  if (score >= 70) return "text-blue-600 dark:text-blue-400"
  if (score >= 50) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}
