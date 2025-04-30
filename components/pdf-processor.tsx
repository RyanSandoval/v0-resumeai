"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { extractTextFromPDF } from "@/lib/parsers/robust-pdf-parser"
import { generatePDFDiagnosticsReport } from "@/lib/diagnostics/pdf-diagnostics"
import { analyzeExtractedText } from "@/lib/testing/pdf-test-utility"
import { Progress } from "@/components/ui/progress"

interface PDFProcessorProps {
  file: File
  onTextExtracted: (text: string) => void
  onError: (error: Error) => void
}

export function PDFProcessor({ file, onTextExtracted, onError }: PDFProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<string | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  // Process the PDF when component mounts or file changes
  useEffect(() => {
    if (file) {
      processPDF()
    }
  }, [file])

  const processPDF = async () => {
    if (!file || isProcessing) return

    try {
      setIsProcessing(true)
      setError(null)
      setStatus("Analyzing PDF file...")
      setProgress(10)

      // Start with diagnostics
      setStatus("Running PDF diagnostics...")
      const diagnosticsReport = await generatePDFDiagnosticsReport(file)
      setDiagnostics(diagnosticsReport)
      setProgress(30)

      // Extract text
      setStatus("Extracting text from PDF...")
      const text = await extractTextFromPDF(file)
      setProgress(80)

      // Analyze extraction quality
      setStatus("Analyzing extraction quality...")
      const analysis = analyzeExtractedText(text)
      setProgress(90)

      if (analysis.quality === "poor") {
        setStatus("Warning: Low quality text extraction")
        console.warn("Low quality extraction detected:", analysis)
      } else {
        setStatus(`Extraction complete (${analysis.wordCount} words, ${analysis.detectedSections.length} sections)`)
      }

      // Pass the extracted text back
      onTextExtracted(text)
      setProgress(100)
    } catch (error) {
      console.error("Error processing PDF:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error processing PDF"
      setError(errorMessage)
      onError(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    processPDF()
  }

  const toggleDiagnostics = () => {
    setShowDiagnostics((prev) => !prev)
  }

  return (
    <div className="pdf-processor space-y-4">
      {isProcessing ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <p>{status}</p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>PDF Processing Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
            {diagnostics && (
              <Button variant="outline" size="sm" onClick={toggleDiagnostics}>
                {showDiagnostics ? "Hide Diagnostics" : "Show Diagnostics"}
              </Button>
            )}
          </div>
          {showDiagnostics && diagnostics && (
            <pre className="mt-4 max-h-60 overflow-auto rounded bg-slate-100 p-2 text-xs dark:bg-slate-800">
              {diagnostics}
            </pre>
          )}
        </Alert>
      ) : status ? (
        <Alert variant="default" className="bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>PDF Processed Successfully</AlertTitle>
          <AlertDescription>{status}</AlertDescription>
          {diagnostics && (
            <Button variant="link" size="sm" onClick={toggleDiagnostics} className="mt-2 p-0">
              {showDiagnostics ? "Hide Diagnostics" : "Show Diagnostics"}
            </Button>
          )}
          {showDiagnostics && diagnostics && (
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-100 p-2 text-xs dark:bg-slate-800">
              {diagnostics}
            </pre>
          )}
        </Alert>
      ) : null}
    </div>
  )
}
