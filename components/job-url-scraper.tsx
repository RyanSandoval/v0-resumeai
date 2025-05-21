"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, LinkIcon } from "lucide-react"
import { extractJobPosting, type JobPostingData } from "@/app/actions/extract-job-posting"

interface JobUrlScraperProps {
  onJobDataExtracted: (jobData: JobPostingData) => void
}

export function JobUrlScraper({ onJobDataExtracted }: JobUrlScraperProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [partialExtraction, setPartialExtraction] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) {
      setError("Please enter a job posting URL")
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch (e) {
      setError("Please enter a valid URL")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setPartialExtraction(false)

    try {
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out after 15 seconds")), 15000)
      })

      // Race the actual request against the timeout
      const result = (await Promise.race([extractJobPosting(url), timeoutPromise])) as Awaited<
        ReturnType<typeof extractJobPosting>
      >

      if (result.success && result.data) {
        setSuccess(true)

        // Check if we have partial data (some fields missing)
        const requiredFields = ["title", "company", "jobDescription"]
        const hasAllRequiredFields = requiredFields.every(
          (field) => result.data && result.data[field as keyof JobPostingData],
        )

        setPartialExtraction(!hasAllRequiredFields)

        // Pass the extracted data to the parent component
        onJobDataExtracted(result.data)
      } else {
        setError(result.error || "Failed to extract job data from the provided URL")
      }
    } catch (error) {
      console.error("Error in job URL extraction:", error)

      if (error instanceof Error && error.message.includes("timed out")) {
        setError(
          "Request timed out. The job site may be slow or blocking our request. Try copying the job description manually.",
        )
      } else {
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while connecting to the server. Please try again later.",
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <Input
                type="url"
                placeholder="Paste job posting URL (LinkedIn, Indeed, etc.)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Extract
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Paste a URL from LinkedIn, Indeed, Glassdoor, or other job sites to automatically extract job details.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                {error.includes("timed out") || error.includes("connecting to server") ? (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Suggestions:</p>
                    <ul className="text-sm list-disc pl-5 mt-1">
                      <li>Check your internet connection</li>
                      <li>Try a different job posting URL</li>
                      <li>Copy and paste the job description manually</li>
                    </ul>
                  </div>
                ) : null}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant={partialExtraction ? "warning" : "success"} className="bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{partialExtraction ? "Partial Extraction Successful" : "Extraction Successful"}</AlertTitle>
              <AlertDescription>
                {partialExtraction
                  ? "Some job details were extracted. Please review and fill in any missing information."
                  : "Job details have been successfully extracted and populated in the form."}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
