"use client"

import { useState } from "react"
import { ResumeUpload } from "@/components/resume-upload"
import type { ResumeFile } from "@/components/resume-optimizer"
import { isValidResumeContent } from "@/lib/file-utils"
import { useToast } from "@/hooks/use-toast"

interface ClientFileProcessorProps {
  onFileSelected: (file: ResumeFile) => void
  selectedFile: ResumeFile | null
}

export function ClientFileProcessor({ onFileSelected, selectedFile }: ClientFileProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleFileSelected = (file: ResumeFile | null) => {
    // FIX: Handle null case to reset the state
    if (!file) {
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)

    // If the file is a PDF and is still being processed, we'll wait
    if (file.processing) {
      return
    }

    // Validate the content
    const fileType = file.file.name.split(".").pop()?.toLowerCase()
    if (!isValidResumeContent(file.text, fileType)) {
      toast({
        title: "Invalid resume content",
        description: "The uploaded file doesn't appear to be a valid resume. Please try another file.",
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    // Pass the file to the parent component
    onFileSelected(file)
    setIsProcessing(false)
  }

  return <ResumeUpload onFileSelected={handleFileSelected} selectedFile={selectedFile} />
}
