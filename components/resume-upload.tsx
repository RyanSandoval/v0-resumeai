"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, FileText, X, AlertCircle, FileWarning, Loader2, FileType, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { extractTextFromFile, validateResumeFile, getSampleResume, isValidResumeContent } from "@/lib/file-utils"
import type { ResumeFile } from "@/components/resume-optimizer"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [usingSampleResume, setUsingSampleResume] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [parsingDetails, setParsingDetails] = useState<string | null>(null)
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
      setUsingSampleResume(false)
      setParsingDetails(null)
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
    setUsingSampleResume(false)
    setParsingDetails(null)
    simulateProgress()

    try {
      toast({
        title: "Processing file",
        description: `Extracting text from your ${file.name.split(".").pop()?.toUpperCase()} resume...`,
      })

      console.log(`Processing ${file.name} (${file.type}, ${file.size} bytes)`)

      // Set parsing details based on file type
      const fileType = file.name.split(".").pop()?.toLowerCase()
      if (fileType === "pdf") {
        setParsingDetails("Using PDF.js to extract text from your PDF file...")
      } else if (fileType === "docx") {
        setParsingDetails("Using mammoth.js to extract text from your DOCX file...")
      } else {
        setParsingDetails("Processing your text file...")
      }

      const text = await extractTextFromFile(file)

      completeProgress()

      // Check if the extracted text is valid resume content
      if (!isValidResumeContent(text)) {
        setProcessingWarning("The extracted text doesn't appear to be a resume. Please check the file and try again.")
      }

      // Check if we're using the sample resume
      if (text === getSampleResume()) {
        setUsingSampleResume(true)
        setProcessingWarning(
          "We couldn't extract text from your file. Using a sample resume for demonstration purposes.",
        )
        toast({
          title: "Processing issue",
          description: "We couldn't extract text from your file. Using a sample resume instead.",
          variant: "default",
        })
      } else if (text.length < 100) {
        setProcessingWarning("The extracted text seems very short. The file might not be properly processed.")
        toast({
          title: "Warning",
          description: "The extracted text seems very short. The file might not be properly processed.",
          variant: "default",
        })
      } else {
        // Success case
        setParsingDetails(`Successfully extracted ${text.length} characters from your resume.`)
      }

      onFileSelected({
        file,
        text,
        type: file.name.split(".").pop()?.toLowerCase() || "",
      })

      if (!usingSampleResume && text !== getSampleResume()) {
        toast({
          title: "File processed",
          description: "Your resume has been successfully processed.",
        })
      }
    } catch (error) {
      completeProgress()
      const errorMessage = error instanceof Error ? error.message : "Could not extract text from the file"

      // Special handling for different file types
      if (file.name.endsWith(".docx")) {
        const docxError = "We're having trouble processing your DOCX file. Try converting it to PDF or TXT format."
        toast({
          title: "DOCX Processing Error",
          description: docxError,
          variant: "destructive",
        })
        setProcessingError(docxError)
      } else if (file.name.endsWith(".pdf")) {
        const pdfError =
          "We're having trouble processing your PDF file. Try converting it to TXT format or ensure it contains selectable text."
        toast({
          title: "PDF Processing Error",
          description: pdfError,
          variant: "destructive",
        })
        setProcessingError(pdfError)
      } else {
        toast({
          title: "Error reading file",
          description: errorMessage,
          variant: "destructive",
        })
        setProcessingError(errorMessage)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUseSampleResume = (originalFile: File) => {
    setUsingSampleResume(true)
    const sampleText = getSampleResume()

    onFileSelected({
      file: originalFile,
      text: sampleText,
      type: originalFile.name.split(".").pop()?.toLowerCase() || "",
    })

    setProcessingWarning(
      "Using a sample resume for demonstration purposes. You can continue with the optimization process.",
    )

    toast({
      title: "Using sample resume",
      description: "You can continue with the optimization process using our sample resume.",
    })
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
    setUsingSampleResume(false)
    setParsingDetails(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const retryFileProcessing = async () => {
    if (selectedFile) {
      await handleFileChange(selectedFile.file)
    }
  }

  const handleUseSampleResumeClick = () => {
    if (selectedFile) {
      handleUseSampleResume(selectedFile.file)
    } else if (fileInputRef.current?.files?.[0]) {
      handleUseSampleResume(fileInputRef.current.files[0])
    } else {
      // Create a dummy file if no file is selected
      const dummyFile = new File([""], "sample-resume.txt", { type: "text/plain" })
      handleUseSampleResume(dummyFile)
    }
    setProcessingError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Upload Your Resume</h2>
        <Button variant="ghost" size="sm" onClick={() => setShowHelpDialog(true)}>
          <HelpCircle className="h-4 w-4 mr-1" />
          <span>Help</span>
        </Button>
      </div>

      {processingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{processingError}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleButtonClick}>
                Try Another File
              </Button>
              <Button variant="default" size="sm" onClick={handleUseSampleResumeClick}>
                Use Sample Resume
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setProcessingError(null)}>
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

      {usingSampleResume && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <FileType className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-600 dark:text-blue-400">Using Sample Resume</AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            You're using our sample resume. You can continue with the optimization process.
          </AlertDescription>
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
            <div className="flex flex-wrap gap-2">
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
              <Button onClick={handleUseSampleResumeClick} variant="secondary">
                Use Sample Resume
              </Button>
            </div>
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
                  <span>{parsingDetails || "Processing file..."}</span>
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

              {parsingDetails && !isProcessing && <div className="mt-2 text-xs text-slate-500">{parsingDetails}</div>}

              <div className="flex justify-end mt-4 gap-2">
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

      {/* File Format Tips */}
      {selectedFile?.file.name.endsWith(".docx") && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <FileType className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-600 dark:text-blue-400">DOCX File Tips</AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            <p>We're using mammoth.js to extract text from your DOCX file. If you're having issues:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Try saving your DOCX as a PDF or TXT file</li>
              <li>Ensure your DOCX file doesn't contain complex formatting or images</li>
              <li>Make sure the file isn't password protected or corrupted</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {selectedFile?.file.name.endsWith(".pdf") && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <FileType className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-600 dark:text-blue-400">PDF File Tips</AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            <p>We're using PDF.js to extract text from your PDF file. If you're having issues:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Ensure your PDF contains selectable text (not just images)</li>
              <li>Try saving as a TXT file if possible</li>
              <li>Make sure the file isn't password protected or secured</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resume Upload Help</DialogTitle>
            <DialogDescription>Tips for successfully uploading your resume</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Supported File Formats</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>
                  <strong>PDF:</strong> Processed using PDF.js for accurate text extraction
                </li>
                <li>
                  <strong>DOCX:</strong> Processed using mammoth.js for reliable text extraction
                </li>
                <li>
                  <strong>TXT:</strong> Most reliable but loses formatting
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-1">Troubleshooting</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>If your file isn't processing, try converting it to TXT format</li>
                <li>Ensure your PDF contains actual text, not just images of text</li>
                <li>Remove any password protection or security settings</li>
                <li>Try using the "Use Sample Resume" option to test the functionality</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowHelpDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
