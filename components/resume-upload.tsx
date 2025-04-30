"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, FileText, X, AlertCircle, FileWarning, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { extractTextFromFile, validateResumeFile } from "@/lib/file-utils"
import type { ResumeFile } from "@/components/resume-optimizer"
import { Progress } from "@/components/ui/progress"

interface ResumeUploadProps {
  onFileSelected: (file: ResumeFile | null) => void
  selectedFile: ResumeFile | null
}

export function ResumeUpload({ onFileSelected, selectedFile }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingWarning, setProcessingWarning] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
    }
  }, [])

  const simulateProgress = () => {
    setProcessingProgress(0)

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
    }

    progressTimerRef.current = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        return newProgress >= 90 ? 90 : newProgress
      })
    }, 300)
  }

  const completeProgress = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setProcessingProgress(100)
  }

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      onFileSelected(null)
      setProcessingError(null)
      setProcessingWarning(null)
      return
    }

    // Validate file before processing
    const validation = validateResumeFile(file)
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      })
      setProcessingError(validation.error || "Invalid file format")
      return
    }

    setIsProcessing(true)
    setProcessingError(null)
    setProcessingWarning(null)
    simulateProgress()

    try {
      toast({
        title: "Processing file",
        description: "Extracting text from your resume...",
      })

      const text = await extractTextFromFile(file)

      completeProgress()

      if (text.length < 100) {
        setProcessingWarning("The extracted text seems very short. The file might not be properly processed.")
        toast({
          title: "Warning",
          description: "The extracted text seems very short. The file might not be properly processed.",
          variant: "default",
        })
      }

      onFileSelected({
        file,
        text,
        type: file.name.split(".").pop()?.toLowerCase() || "",
      })

      toast({
        title: "File processed",
        description: "Your resume has been successfully processed.",
      })
    } catch (error) {
      completeProgress()
      const errorMessage = error instanceof Error ? error.message : "Could not extract text from the file"
      toast({
        title: "Error reading file",
        description: errorMessage,
        variant: "destructive",
      })
      setProcessingError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files.length > 0) {
      await handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const removeFile = () => {
    onFileSelected(null)
    setProcessingError(null)
    setProcessingWarning(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const retryFileProcessing = async () => {
    if (selectedFile) {
      await handleFileChange(selectedFile.file)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Upload Your Resume</h2>

      {processingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{processingError}</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleButtonClick}>
                Try Another File
              </Button>
              <Button variant="default" size="sm" onClick={() => setProcessingError(null)}>
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {processingWarning && !processingError && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <FileWarning className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-600 dark:text-amber-400">Warning</AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-400">{processingWarning}</AlertDescription>
        </Alert>
      )}

      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed ${
            isDragging ? "border-primary bg-primary/5" : "border-slate-300 dark:border-slate-700"
          } transition-colors`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Upload className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Drag and drop your resume</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Supports PDF, DOCX, and TXT formats</p>
            <Button onClick={handleButtonClick} variant="outline" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Browse Files"
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              disabled={isProcessing}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="font-medium">{selectedFile.file.name}</p>
                  <p className="text-sm text-slate-500">{(selectedFile.file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Processing file...</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="h-2" />
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-medium mb-2">Preview of extracted text:</h3>
              <div className="max-h-[150px] overflow-y-auto text-sm font-mono whitespace-pre-wrap p-2 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                {selectedFile.text.slice(0, 500)}
                {selectedFile.text.length > 500 && "..."}
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" onClick={retryFileProcessing} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Re-process File"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
