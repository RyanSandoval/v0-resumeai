"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Link, AlertCircle, Info } from "lucide-react"
import { scrapeResumeFromUrl } from "@/app/actions/scrape-resume"
import { formatScrapedResumeToText } from "@/lib/resume-formatter"
import { useToast } from "@/hooks/use-toast"

interface ResumeUrlInputProps {
  onResumeExtracted: (text: string) => void
}

export function ResumeUrlInput({ onResumeExtracted }: ResumeUrlInputProps) {
  const [resumeUrl, setResumeUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [extractionResult, setExtractionResult] = useState<{
    success: boolean
    error?: string
    source?: string
  } | null>(null)
  const { toast } = useToast()

  const fetchResumeFromUrl = async () => {
    if (!resumeUrl) {
      toast({
        title: "URL required",
        description: "Please enter a URL containing your resume.",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    if (!resumeUrl.startsWith("http://") && !resumeUrl.startsWith("https://")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setExtractionResult(null)

    try {
      const result = await scrapeResumeFromUrl(resumeUrl)

      if (result.success && result.data) {
        // Format the scraped data into resume text
        const formattedResume = formatScrapedResumeToText(result.data)

        // Pass the formatted resume text to the parent component
        onResumeExtracted(formattedResume)

        setExtractionResult({
          success: true,
          source: result.source,
        })

        toast({
          title: "Resume extracted",
          description: `Successfully extracted resume from ${result.source || "website"}`,
        })
      } else {
        setExtractionResult({
          success: false,
          error: result.error || "Failed to extract resume from the provided URL",
          source: result.source,
        })

        toast({
          title: "Extraction failed",
          description: result.error || "Could not extract resume from the provided URL",
          variant: "destructive",
        })
      }
    } catch (error) {
      setExtractionResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })

      toast({
        title: "Error fetching resume",
        description: "Could not extract resume from the provided URL.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resume-url">Resume URL</Label>
        <div className="flex space-x-2">
          <Input
            id="resume-url"
            placeholder="https://example.com/my-resume"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            disabled={isLoading}
          />
          <Button onClick={fetchResumeFromUrl} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              "Extract"
            )}
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          Enter the URL of a webpage containing your resume to automatically extract the content.
        </p>
      </div>

      {extractionResult && (
        <Alert
          className={extractionResult.success ? "bg-green-50 dark:bg-green-950/30" : "bg-amber-50 dark:bg-amber-950/30"}
        >
          <AlertDescription className="flex items-center">
            {extractionResult.success ? (
              <>
                <Link className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                <span>
                  Successfully extracted resume from {extractionResult.source}.
                  <br />
                  <span className="text-sm text-slate-500">You can now edit the extracted content if needed.</span>
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-600 dark:text-amber-400">
                  {extractionResult.error}
                  <br />
                  <span className="text-sm text-slate-500">
                    Try uploading your resume file directly or entering it manually.
                    {extractionResult.source && (
                      <>
                        <br />
                        Source: {extractionResult.source}
                      </>
                    )}
                  </span>
                </span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle>Tips for best results</AlertTitle>
        <AlertDescription className="text-blue-600 dark:text-blue-400">
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>Use URLs from personal websites, portfolio pages, or online resume platforms</li>
            <li>Make sure the page is publicly accessible (not behind a login)</li>
            <li>For LinkedIn profiles, use the "Export to PDF" feature and upload the file instead</li>
            <li>After extraction, review and edit the content to ensure accuracy</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
