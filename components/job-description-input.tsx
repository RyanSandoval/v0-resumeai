"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Link, AlertCircle, Info } from "lucide-react"
import { extractJobDescription } from "@/app/actions/extract-job-description"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface JobDescriptionInputProps {
  value: string
  onChange: (value: string) => void
}

export function JobDescriptionInput({ value, onChange }: JobDescriptionInputProps) {
  const [inputMethod, setInputMethod] = useState<"paste" | "url">("paste")
  const [jobUrl, setJobUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [extractionResult, setExtractionResult] = useState<{
    success: boolean
    error?: string
    source?: string
  } | null>(null)
  const { toast } = useToast()

  const fetchJobDescription = async () => {
    if (!jobUrl) {
      toast({
        title: "URL required",
        description: "Please enter a job posting URL.",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    if (!jobUrl.startsWith("http://") && !jobUrl.startsWith("https://")) {
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
      const result = await extractJobDescription(jobUrl)

      if (result.success && result.jobDescription) {
        onChange(result.jobDescription)
        setExtractionResult({
          success: true,
          source: result.source,
        })
        toast({
          title: "Job description extracted",
          description: `Successfully extracted job details from ${result.source || "website"}`,
        })
      } else {
        setExtractionResult({
          success: false,
          error: result.error || "Failed to extract job description",
          source: result.source,
        })
        toast({
          title: "Extraction failed",
          description: result.error || "Could not extract job description from the provided URL",
          variant: "destructive",
        })
      }
    } catch (error) {
      setExtractionResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
      toast({
        title: "Error fetching job description",
        description: "Could not extract job description from the provided URL.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isLinkedInUrl = jobUrl.includes("linkedin.com")

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Job Description</h2>

      <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste">Paste Text</TabsTrigger>
          <TabsTrigger value="url">From URL</TabsTrigger>
        </TabsList>
        <TabsContent value="paste" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-description">Paste the job description</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the full job description here..."
              className="min-h-[200px]"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </TabsContent>
        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-url">Job posting URL</Label>
            <div className="flex space-x-2">
              <Input
                id="job-url"
                placeholder="https://example.com/job-posting"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button onClick={fetchJobDescription} disabled={isLoading}>
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
              Enter the URL of the job posting to automatically extract the job description. Works with many job sites.
            </p>

            {isLinkedInUrl && (
              <Alert variant="default" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-600 dark:text-blue-400">
                  LinkedIn URLs may require you to be logged in to view job details. For best results, copy and paste
                  the job description directly.
                </AlertDescription>
              </Alert>
            )}

            {extractionResult && (
              <Alert
                className={
                  extractionResult.success ? "bg-green-50 dark:bg-green-950/30" : "bg-amber-50 dark:bg-amber-950/30"
                }
              >
                <AlertDescription className="flex items-center">
                  {extractionResult.success ? (
                    <>
                      <Link className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      <span>
                        Successfully extracted job description from {extractionResult.source}.
                        <br />
                        <span className="text-sm text-slate-500">
                          You can now edit the text in the "Paste Text" tab if needed.
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                      <span className="text-amber-600 dark:text-amber-400">
                        {extractionResult.error}
                        <br />
                        <span className="text-sm text-slate-500">
                          Try copying the job description manually from the website.
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

            {value && inputMethod === "url" && (
              <div className="mt-4">
                <Label htmlFor="extracted-description">Extracted Job Description</Label>
                <div className="mt-2 p-3 border rounded-md bg-slate-50 dark:bg-slate-900 max-h-[200px] overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">{value}</pre>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
