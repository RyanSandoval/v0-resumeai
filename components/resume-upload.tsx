"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileText, Upload, X } from "lucide-react"
import { extractTextFromFile, getSampleResume, validateResumeFile } from "@/lib/file-utils"
import { useToast } from "@/hooks/use-toast"
import type { ResumeFile } from "@/components/resume-optimizer"

interface ResumeUploadProps {
  onFileSelected: (file: ResumeFile) => void
  selectedFile: ResumeFile | null
}

export function ResumeUpload({ onFileSelected, selectedFile }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    setError(null)
    setIsProcessing(true)

    try {
      // Validate file before processing
      const validation = validateResumeFile(file)
      if (!validation.valid) {
        setError(validation.error || "Invalid file")
        setIsProcessing(false)
        return
      }

      // Extract text from file
      const text = await extractTextFromFile(file)

      // Set the selected file
      onFileSelected({
        file,
        text,
        type: file.name.split(".").pop()?.toLowerCase() || "",
      })

      toast({
        title: "Resume uploaded",
        description: `Successfully processed ${file.name}`,
      })
    } catch (error) {
      console.error("Error processing file:", error)
      setError(error instanceof Error ? error.message : "Failed to process file")

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveFile = () => {
    onFileSelected({
      file: new File([""], "sample-resume.txt", { type: "text/plain" }),
      text: "",
      type: "txt",
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUseSample = () => {
    const sampleText = getSampleResume()
    onFileSelected({
      file: new File([sampleText], "sample-resume.txt", { type: "text/plain" }),
      text: sampleText,
      type: "txt",
    })

    toast({
      title: "Sample resume loaded",
      description: "You can now proceed with the sample resume",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Upload Your Resume</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload your resume to get started with optimization
          </p>
        </div>
        {!selectedFile && (
          <Button variant="outline" size="sm" onClick={handleUseSample}>
            Use Sample Resume
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed ${
            isDragging ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700"
          } transition-colors duration-200`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Drag and drop your resume</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Supports PDF, DOCX, and TXT files (max 10MB)
            </p>
            <div className="flex flex-col items-center gap-2">
              <Label
                htmlFor="resume-upload"
                className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Browse Files
              </Label>
              <Input
                id="resume-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              {isProcessing && <p className="text-sm text-slate-500">Processing file...</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedFile.file.name}</p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.file.size / 1024).toFixed(1)} KB • {selectedFile.type.toUpperCase()}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
