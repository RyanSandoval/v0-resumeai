"use client"

import { useState } from "react"
import { ResumeUpload } from "@/components/resume-upload"
import { PDFProcessor } from "@/components/pdf-processor"
import type { ResumeFile } from "@/components/resume-optimizer"

interface ClientFileProcessorProps {
  onFileSelected: (file: ResumeFile) => void
  selectedFile: ResumeFile | null
}

export function ClientFileProcessor({ onFileSelected, selectedFile }: ClientFileProcessorProps) {
  const [isPDFProcessing, setIsPDFProcessing] = useState(false)
  const [pdfFile, setPDFFile] = useState<File | null>(null)

  // Handle file selection from ResumeUpload
  const handleFileSelected = (file: ResumeFile) => {
    // If it's a PDF file, we need special handling
    if (file.type === "pdf") {
      setIsPDFProcessing(true)
      setPDFFile(file.file)

      // Pass a placeholder to the parent while we process the PDF
      onFileSelected({
        ...file,
        text: "", // Will be filled in by PDFProcessor
        processing: true,
      })
    } else {
      // For non-PDF files, just pass through
      onFileSelected(file)
    }
  }

  // Handle text extraction from PDFProcessor
  const handlePDFTextExtracted = (text: string) => {
    if (pdfFile) {
      onFileSelected({
        file: pdfFile,
        text,
        type: "pdf",
        processing: false,
      })
    }
    setIsPDFProcessing(false)
  }

  // Handle PDF processing errors
  const handlePDFError = (error: Error) => {
    console.error("PDF processing error:", error)
    setIsPDFProcessing(false)

    // If we have a file, pass it with the error
    if (pdfFile) {
      onFileSelected({
        file: pdfFile,
        text: `Error processing PDF: ${error.message}. Please try a different file or format.`,
        type: "pdf",
        processing: false,
      })
    }
  }

  return (
    <div className="space-y-4">
      <ResumeUpload onFileSelected={handleFileSelected} selectedFile={selectedFile} />

      {isPDFProcessing && pdfFile && (
        <PDFProcessor file={pdfFile} onTextExtracted={handlePDFTextExtracted} onError={handlePDFError} />
      )}
    </div>
  )
}
