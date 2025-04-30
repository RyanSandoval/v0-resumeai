"use client"

import { useEffect, useState } from "react"
import { extractTextFromPDFEnhanced, initializePDFJS } from "@/lib/parsers/enhanced-pdf-parser"
import { logFileInfo } from "@/lib/debug-utils"
import { Button } from "@/components/ui/button"

interface PDFProcessorProps {
  file: File
  onTextExtracted: (text: string) => void
  onError: (error: Error) => void
}

export function PDFClientProcessor({ file, onTextExtracted, onError }: PDFProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState("")
  const [initialized, setInitialized] = useState(false)

  // Initialize PDF.js when component mounts
  useEffect(() => {
    const init = async () => {
      try {
        const success = await initializePDFJS()
        setInitialized(success)
        if (!success) {
          setStatus("PDF.js initialization failed. Try reloading the page.")
        }
      } catch (error) {
        console.error("PDF.js initialization error:", error)
        setStatus("PDF.js initialization error. Try reloading the page.")
      }
    }

    init()
  }, [])

  // Process the PDF when file changes or initialization completes
  useEffect(() => {
    if (file && initialized && !isProcessing) {
      processPDF()
    }
  }, [file, initialized])

  const processPDF = async () => {
    if (!file || isProcessing) return

    try {
      setIsProcessing(true)
      setStatus("Processing PDF...")

      logFileInfo(file)
      const text = await extractTextFromPDFEnhanced(file)

      onTextExtracted(text)
      setStatus("PDF processed successfully!")
    } catch (error) {
      console.error("Error processing PDF:", error)
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      onError(error instanceof Error ? error : new Error("Unknown PDF processing error"))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    processPDF()
  }

  return (
    <div className="pdf-processor">
      {status && <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">Status: {status}</div>}

      {(!initialized || (isProcessing && status)) && (
        <div className="flex items-center justify-center p-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-2 text-sm">Processing...</span>
        </div>
      )}

      {!isProcessing && status && status.startsWith("Error") && (
        <Button variant="secondary" size="sm" onClick={handleRetry} className="mt-2">
          Retry PDF Processing
        </Button>
      )}
    </div>
  )
}
