"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Upload, AlertCircle, Loader2 } from "lucide-react"
import { extractTextFromFile, validateResumeFile, isValidResumeContent } from "@/lib/file-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface PDFClientProcessorProps {
  onFileProcessed: (text: string, file: File) => void
  processingText?: string
  buttonText?: string
  className?: string
}

export function PDFClientProcessor({
  onFileProcessed,
  processingText = "Processing your resume...",
  buttonText = "Upload Resume",
  className = "",
}: PDFClientProcessorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Reset progress when a new file is selected
  useEffect(() => {
    if (file) {
      setProgress(0)
    }
  }, [file])

  // Simulate progress updates during processing
  useEffect(() => {
    if (processing) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const increment = prev < 50 ? 15 : prev < 85 ? 5 : 1
          const newProgress = prev + increment
          return newProgress >= 95 ? 95 : newProgress
        })
      }, 300)

      return () => clearInterval(interval)
    }
  }, [processing])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setProcessing(true)
    setProgress(10)

    try {
      // Validate file
      const validation = validateResumeFile(selectedFile)
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid file")
      }

      // Extract text from file
      const extractedText = await extractTextFromFile(selectedFile)
      setProgress(90)

      // Validate content
      if (!isValidResumeContent(extractedText, selectedFile.type)) {
        throw new Error("We couldn't extract meaningful resume content. Please try a different file or format.")
      }

      setProgress(100)
      onFileProcessed(extractedText, selectedFile)
    } catch (err) {
      console.error("Error processing file:", err)
      setError(err instanceof Error ? err.message : "Failed to process file")
    } finally {
      setProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) {
      processFile(e.dataTransfer.files[0])
    }
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {file && !error ? (
          <div className="space-y-4">
            {processing ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">{processingText}</p>
                    <p className="text-xs text-muted-foreground">
                      Processing {file.name} ({Math.round(file.size / 1024)} KB)
                    </p>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    setFile(null)
                    setError(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  Change
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="mt-2 text-lg font-semibold">Upload your resume</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground text-center">
                Drag and drop your resume file here or click the button below
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={processing} className="relative">
                {buttonText}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">Supported formats: PDF, DOC, DOCX, TXT, RTF</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
