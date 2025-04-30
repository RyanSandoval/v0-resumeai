"use client"

import { useEffect, useState } from "react"
import { ResumeUpload } from "./resume-upload"
import type { ResumeFile } from "./resume-optimizer"

interface ClientFileProcessorProps {
  onFileSelected: (file: ResumeFile) => void
  selectedFile: ResumeFile | null
}

export function ClientFileProcessor({ onFileSelected, selectedFile }: ClientFileProcessorProps) {
  const [isClient, setIsClient] = useState(false)

  // This ensures the component only renders on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="p-8 text-center">Loading file processor...</div>
  }

  return <ResumeUpload onFileSelected={onFileSelected} selectedFile={selectedFile} />
}
