"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { isValidJobUrl, isKnownJobSite, cleanJobUrl, extractJobId } from "@/lib/job-url-utils"

export function JobUrlDiagnostics() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)

  const runDiagnostics = async () => {
    if (!url) return

    setIsLoading(true)
    setDiagnosticResults(null)

    try {
      // Basic URL validation
      const isValid = isValidJobUrl(url)
      const isKnown = isKnownJobSite(url)
      const cleanedUrl = cleanJobUrl(url)
      const jobId = extractJobId(url)

      // Test network connectivity
      let networkStatus = "Unknown"
      let responseStatus = "Unknown"
      let contentType = "Unknown"
      let contentLength = "Unknown"
      let errorMessage = null

      try {
        const response = await fetch("/api/test-url-connectivity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: cleanedUrl }),
        })

        const result = await response.json()

        networkStatus = result.success ? "Connected" : "Failed"
        responseStatus = result.status || "Unknown"
        contentType = result.contentType || "Unknown"
        contentLength = result.contentLength || "Unknown"
        errorMessage = result.error || null
      } catch (error) {
        networkStatus = "Error"
        errorMessage = error instanceof Error ? error.message : "Unknown error"
      }

      // Set diagnostic results
      setDiagnosticResults({
        url,
        cleanedUrl,
        isValid,
        isKnown,
        jobId,
        networkStatus,
        responseStatus,
        contentType,
        contentLength,
        errorMessage,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setDiagnosticResults({
        url,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Job URL Diagnostics</CardTitle>
        <CardDescription>Test job URLs to diagnose connectivity issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter job URL to test"
              className="flex-1"
            />
            <Button onClick={runDiagnostics} disabled={isLoading || !url}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Run Test"
              )}
            </Button>
          </div>

          {diagnosticResults && (
            <div className="border rounded-md p-4 bg-slate-50">
              <h3 className="font-medium mb-2">Diagnostic Results</h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">URL:</div>
                  <div className="truncate">{diagnosticResults.url}</div>

                  <div className="font-medium">Cleaned URL:</div>
                  <div className="truncate">{diagnosticResults.cleanedUrl}</div>

                  <div className="font-medium">Valid URL:</div>
                  <div>{diagnosticResults.isValid ? "Yes" : "No"}</div>

                  <div className="font-medium">Known Job Site:</div>
                  <div>{diagnosticResults.isKnown ? "Yes" : "No"}</div>

                  <div className="font-medium">Job ID:</div>
                  <div>{diagnosticResults.jobId || "Not detected"}</div>

                  <div className="font-medium">Network Status:</div>
                  <div className={diagnosticResults.networkStatus === "Connected" ? "text-green-600" : "text-red-600"}>
                    {diagnosticResults.networkStatus}
                  </div>

                  <div className="font-medium">Response Status:</div>
                  <div>{diagnosticResults.responseStatus}</div>

                  <div className="font-medium">Content Type:</div>
                  <div>{diagnosticResults.contentType}</div>

                  <div className="font-medium">Content Length:</div>
                  <div>{diagnosticResults.contentLength}</div>
                </div>

                {diagnosticResults.errorMessage && (
                  <div className="mt-2">
                    <div className="font-medium">Error:</div>
                    <div className="text-red-600 whitespace-pre-wrap">{diagnosticResults.errorMessage}</div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Timestamp: {new Date(diagnosticResults.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
