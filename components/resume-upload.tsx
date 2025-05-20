"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { extractTextFromFile, validateResumeFile } from "@/lib/file-utils"
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { ResumeFile } from "@/components/resume-optimizer"

interface ResumeUploadProps {
  onFileSelected: (file: ResumeFile | null) => void
  selectedFile: ResumeFile | null
}

export function ResumeUpload({ onFileSelected, selectedFile }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileChange = useCallback(
    async (file: File | null) => {
      // Reset state
      setError(null)
      setProgress(0)

      // If no file is selected, reset
      if (!file) {
        onFileSelected(null)
        return
      }

      // Validate file
      const validation = validateResumeFile(file)
      if (!validation.valid) {
        setError(validation.error || "Invalid file")
        return
      }

      // Start processing
      setIsProcessing(true)

      // Create a progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5
          return Math.min(prev + increment, 95)
        })
      }, 100)

      try {
        // Extract text from file
        const resumeFile: ResumeFile = {
          file,
          text: "",
          type: file.type,
          processing: true,
        }

        // Notify parent that processing has started
        onFileSelected(resumeFile)

        // Process the file
        const text = await extractTextFromFile(file)

        // Update progress to 100%
        clearInterval(progressInterval)
        setProgress(100)

        // Create resume file object
        const processedFile: ResumeFile = {
          file,
          text,
          type: file.type,
        }

        // Notify parent
        onFileSelected(processedFile)
      } catch (err) {
        clearInterval(progressInterval)
        setProgress(0)
        setError(err instanceof Error ? err.message : "Failed to process file")
        onFileSelected(null)
      } finally {
        setIsProcessing(false)
      }
    },
    [onFileSelected],
  )

  // Handle file input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    handleFileChange(file)
  }

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0] || null
    handleFileChange(file)
  }

  // Handle button click
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Handle file removal
  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onFileSelected(null)
    setProgress(0)
    setError(null)
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
        disabled={isProcessing}
      />

      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed p-6 text-center ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          } hover:border-primary/50 transition-colors cursor-pointer`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            {isProcessing ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">{isProcessing ? "Processing resume..." : "Upload your resume"}</p>
              <p className="text-xs text-muted-foreground">Drag and drop or click to upload (PDF, DOCX, or TXT)</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{selectedFile.file.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemoveFile} disabled={isProcessing}>
              Remove
            </Button>
          </div>
        </Card>
      )}

      {isProcessing && (
        <div className="mt-4 space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">Processing resume... {Math.round(progress)}%</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Error</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {selectedFile && !isProcessing && !error && (
        <div className="mt-4 p-3 bg-success/10 text-success rounded-md flex items-start space-x-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Resume uploaded successfully</p>
            <p className="text-xs">Your resume is ready for optimization</p>
          </div>
        </div>
      )}
    </div>
  )
}
