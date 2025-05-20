"use client"

import { useState, useEffect } from "react"
import { ResumeUpload } from "@/components/resume-upload"
import type { ResumeFile } from "@/components/resume-optimizer"
import { isValidResumeContent } from "@/lib/file-utils"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ClientFileProcessorProps {
  onFileSelected: (file: ResumeFile) => void
  selectedFile: ResumeFile | null
}

export function ClientFileProcessor({ onFileSelected, selectedFile }: ClientFileProcessorProps) {
  const [isClient, setIsClient] = useState(false)
  const [internalFile, setInternalFile] = useState<ResumeFile | null>(selectedFile)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Use useEffect to detect client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Sync internal state with props
  useEffect(() => {
    setInternalFile(selectedFile)
  }, [selectedFile])

  // Handle file selection from the ResumeUpload component
  const handleFileSelected = (file: ResumeFile | null) => {
    // Clear previous errors
    setError(null)

    // Update internal state
    setInternalFile(file)

    // If file is null, reset the parent component
    if (!file) {
      return
    }

    // If the file is still being processed, we'll wait
    if (file.processing) {
      return
    }

    try {
      // Validate the content
      const fileType = file.file.name.split(".").pop()?.toLowerCase()

      // Check for empty or very short content
      if (!file.text || file.text.trim().length < 50) {
        const errorMsg = "The uploaded file doesn't contain enough text content. Please try another file."
        setError(errorMsg)
        toast({
          title: "Invalid resume content",
          description: errorMsg,
          variant: "destructive",
        })
        return
      }

      // Check for garbled content
      if (containsGarbledText(file.text)) {
        const errorMsg = "The file appears to contain garbled or corrupted text. Please try a different file format."
        setError(errorMsg)
        toast({
          title: "Parsing error",
          description: errorMsg,
          variant: "destructive",
        })
        return
      }

      // Check if it looks like a resume
      if (!isValidResumeContent(file.text, fileType)) {
        const errorMsg = "The uploaded file doesn't appear to be a valid resume. Please try another file."
        setError(errorMsg)
        toast({
          title: "Invalid resume content",
          description: errorMsg,
          variant: "destructive",
        })
        return
      }

      // Pass the file to the parent component
      onFileSelected(file)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred processing the file"
      setError(errorMsg)
      toast({
        title: "File processing error",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  // Check if text contains garbled characters (likely encoding issues)
  const containsGarbledText = (text: string): boolean => {
    // Check for high concentration of unusual characters
    const unusualCharCount = (text.match(/[^\x20-\x7E\n\r\t]/g) || []).length
    const textLength = text.length

    // If more than 15% of characters are unusual, consider it garbled
    if (textLength > 0 && unusualCharCount / textLength > 0.15) {
      return true
    }

    // Check for common garbled patterns
    const garbledPatterns = [
      /PK\x03\x04/, // ZIP file header
      /\uFFFD{3,}/, // Unicode replacement character
      /\x00{3,}/, // Null bytes
      /[\x01-\x08\x0B\x0C\x0E-\x1F]{5,}/, // Control characters
    ]

    return garbledPatterns.some((pattern) => pattern.test(text))
  }

  // Only render the component on the client side
  if (!isClient) {
    return <div>Loading file uploader...</div>
  }

  return (
    <div className="space-y-4">
      <ResumeUpload onFileSelected={handleFileSelected} selectedFile={internalFile} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error processing file</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {internalFile && internalFile.text && (
        <div className="text-xs text-muted-foreground">
          Successfully extracted {internalFile.text.length} characters from {internalFile.file.name}
        </div>
      )}
    </div>
  )
}
