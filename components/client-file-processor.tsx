"use client"

import { useState, useEffect } from "react"
import { ResumeUpload } from "@/components/resume-upload"
import type { ResumeFile } from "@/components/resume-optimizer"
import { isValidResumeContent } from "@/lib/file-utils"
import { useToast } from "@/hooks/use-toast"

interface ClientFileProcessorProps {
  onFileSelected: (file: ResumeFile) => void
  selectedFile: ResumeFile | null
}

export function ClientFileProcessor({ onFileSelected, selectedFile }: ClientFileProcessorProps) {
  const [isClient, setIsClient] = useState(false)
  const [internalFile, setInternalFile] = useState<ResumeFile | null>(selectedFile)
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
    // Update internal state
    setInternalFile(file)

    // If file is null, reset the parent component
    if (!file) {
      return
    }

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
      return
    }

    // Pass the file to the parent component
    onFileSelected(file)
  }

  // Only render the component on the client side
  if (!isClient) {
    return <div>Loading file uploader...</div>
  }

  return <ResumeUpload onFileSelected={handleFileSelected} selectedFile={internalFile} />
}
