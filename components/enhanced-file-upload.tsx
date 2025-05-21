"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react"
import { fileProcessingService } from "@/lib/services/file-processing-service"
import type { FileProcessingResult } from "@/lib/services/file-processing-service"

export interface ResumeFile {
  file: File
  text: string
  type: string
  metadata?: any
  processing?: boolean
}

interface EnhancedFileUploadProps {
  onFileSelected: (file: ResumeFile | null) => void
  selectedFile: ResumeFile | null
  acceptedFormats?: string[]
  maxSizeMB?: number
}

export function EnhancedFileUpload({
  onFileSelected,
  selectedFile,
  acceptedFormats = [".pdf", ".docx", ".doc", ".txt"],
  maxSizeMB = 10,
}: EnhancedFileUploadProps) {
  // State
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processingDetails, setProcessingDetails] = useState<string | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileChange = useCallback(
    async (file: File | null) => {
      // Reset state
      setError(null)
      setProgress(0)
      setProcessingDetails(null)

      // If no file is selected, reset
      if (!file) {
        onFileSelected(null)
        return
      }

      // Validate file type
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
      if (!acceptedFormats.includes(fileExtension) && !acceptedFormats.includes("*")) {
        setError(`Invalid file format. Please upload ${acceptedFormats.join(", ")} files.`)
        return
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB.`)
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
        // Create initial resume file object
        const resumeFile: ResumeFile = {
          file,
          text: "",
          type: file.type,
          processing: true,
        }

        // Notify parent that processing has started
        onFileSelected(resumeFile)

        // Process the file using our service
        const result: FileProcessingResult = await fileProcessingService.processFile(file)

        // Update progress to 100%
        clearInterval(progressInterval)
        setProgress(100)

        if (result.success) {
          // Create resume file object with processed text
          const processedFile: ResumeFile = {
            file,
            text: result.text,
            type: file.type,
            metadata: result.metadata,
          }

          // Set processing details for user feedback
          if (result.metadata) {
            setProcessingDetails(
              `Processed using ${result.metadata.parsingMethod} in ${Math.round(result.metadata.processingTime)}ms`,
            )
          }

          // Notify parent
          onFileSelected(processedFile)
        } else {
          // Handle processing error
          setError(result.error?.message || "Failed to process file")
          setProcessingDetails(`Error code: ${result.error?.code}`)
          onFileSelected(null)
        }
      } catch (err) {
        clearInterval(progressInterval)
        setProgress(0)
        setError(err instanceof Error ? err.message : "Failed to process file")
        onFileSelected(null)
      } finally {
        setIsProcessing(false)
      }
    },
    [onFileSelected, acceptedFormats, maxSizeMB],
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
    setProcessingDetails(null)
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept={acceptedFormats.join(",")}
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
              <p className="text-xs text-muted-foreground">
                Drag and drop or click to upload ({acceptedFormats.join(", ")})
              </p>
              <p className="text-xs text-muted-foreground">Maximum file size: {maxSizeMB}MB</p>
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
                {processingDetails && <p className="text-xs text-muted-foreground">{processingDetails}</p>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              disabled={isProcessing}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
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
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedFile && !isProcessing && !error && (
        <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-5 w-5" />
          <AlertTitle>Resume uploaded successfully</AlertTitle>
          <AlertDescription>{selectedFile.text.length} characters extracted from your resume</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
