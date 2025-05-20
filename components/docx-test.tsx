"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, FileText, AlertCircle } from "lucide-react"

export function DocxTest() {
  const [originalText, setOriginalText] = useState<string>("")
  const [enhancedText, setEnhancedText] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsProcessing(true)
    setError(null)
    setOriginalText("")
    setEnhancedText("")

    try {
      // Test original parser
      try {
        const { extractTextFromDOCX } = await import("@/lib/parsers/docx-parser")
        const text = await extractTextFromDOCX(file)
        setOriginalText(text)
      } catch (err) {
        console.error("Original parser error:", err)
        setOriginalText("Error: Failed to parse with original parser")
      }

      // Test enhanced parser
      try {
        const { extractTextFromDOCX: enhancedExtract } = await import("@/lib/parsers/enhanced-docx-parser")
        const text = await enhancedExtract(file)
        setEnhancedText(text)
      } catch (err) {
        console.error("Enhanced parser error:", err)
        setEnhancedText("Error: Failed to parse with enhanced parser")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>DOCX Parser Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".docx,.doc"
            className="hidden"
            disabled={isProcessing}
          />
          <Button onClick={handleButtonClick} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Upload DOCX File
              </>
            )}
          </Button>
        </div>

        {fileName && (
          <div className="text-sm">
            Testing file: <span className="font-medium">{fileName}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        )}

        {(originalText || enhancedText) && (
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="original">Original Parser</TabsTrigger>
              <TabsTrigger value="enhanced">Enhanced Parser</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Original Parser</h3>
                  <div className="border rounded-md p-3 h-[400px] overflow-auto bg-muted/30">
                    <pre className="text-xs whitespace-pre-wrap">{originalText || "No content"}</pre>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Characters: {originalText.length}</div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Enhanced Parser</h3>
                  <div className="border rounded-md p-3 h-[400px] overflow-auto bg-muted/30">
                    <pre className="text-xs whitespace-pre-wrap">{enhancedText || "No content"}</pre>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Characters: {enhancedText.length}</div>
                </div>
              </div>

              <div className="text-sm">
                <h3 className="font-medium mb-1">Analysis:</h3>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>
                    Character count difference: {Math.abs(enhancedText.length - originalText.length)}(
                    {originalText.length > 0 ? Math.round((enhancedText.length / originalText.length) * 100 - 100) : 0}%{" "}
                    {enhancedText.length > originalText.length ? "more" : "less"})
                  </li>
                  <li>Garbled characters in original: {countGarbledCharacters(originalText)}</li>
                  <li>Garbled characters in enhanced: {countGarbledCharacters(enhancedText)}</li>
                  <li>
                    Readability score: Original ({calculateReadabilityScore(originalText)}/10) vs Enhanced (
                    {calculateReadabilityScore(enhancedText)}/10)
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="original">
              <div className="border rounded-md p-4 h-[500px] overflow-auto bg-muted/30">
                <pre className="text-sm whitespace-pre-wrap">{originalText || "No content"}</pre>
              </div>
            </TabsContent>

            <TabsContent value="enhanced">
              <div className="border rounded-md p-4 h-[500px] overflow-auto bg-muted/30">
                <pre className="text-sm whitespace-pre-wrap">{enhancedText || "No content"}</pre>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to count garbled characters
function countGarbledCharacters(text: string): number {
  const garbledChars = text.match(/[^\x20-\x7E\n\r\t]/g) || []
  return garbledChars.length
}

// Helper function to calculate a simple readability score
function calculateReadabilityScore(text: string): number {
  if (!text || text.length < 10) return 0

  // Check for common resume sections
  const sections = ["summary", "experience", "education", "skills", "projects"]
  let sectionCount = 0

  sections.forEach((section) => {
    if (text.toLowerCase().includes(section)) {
      sectionCount++
    }
  })

  // Check for garbled text ratio
  const garbledRatio = countGarbledCharacters(text) / text.length

  // Check for proper paragraph structure
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0)
  const paragraphScore = Math.min(paragraphs.length / 5, 1)

  // Calculate final score
  const sectionScore = Math.min(sectionCount / sections.length, 1) * 4
  const cleanTextScore = Math.max(0, 3 - garbledRatio * 30)
  const structureScore = paragraphScore * 3

  return Math.round(sectionScore + cleanTextScore + structureScore)
}
