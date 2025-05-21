"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { resumeOptimizerTester, type TestSuite } from "@/lib/testing/resume-optimizer-tester"

export default function TestResumeOptimizerPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<TestSuite | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setIsRunning(true)
    setProgress(0)
    setResults(null)
    setError(null)

    try {
      // Show progress updates while running tests
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5
          const newProgress = prev + Math.random() * increment
          return newProgress >= 95 ? 95 : newProgress // Cap at 95% until complete
        })
      }, 300)

      // Run tests
      const testResults = await resumeOptimizerTester.runTests()

      clearInterval(progressInterval)
      setProgress(100)
      setResults(testResults)
    } catch (err) {
      setProgress(0)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsRunning(false)
    }
  }

  // Run tests automatically on page load
  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resume Optimizer Tests</h1>
        <p className="text-muted-foreground">Run comprehensive tests to validate the resume optimization feature</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Test Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end mb-6">
        <Button onClick={runTests} disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run Tests"
          )}
        </Button>
      </div>

      {isRunning && (
        <div className="mb-6">
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-center text-muted-foreground">Running tests... {Math.round(progress)}%</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-md">
                  <div className="text-2xl font-bold">{results.tests.length}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{results.passCount}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Passed</div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{results.failCount}</div>
                  <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Total Duration: {(results.duration / 1000).toFixed(2)}s</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.tests.map((test, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-md ${
                      test.success
                        ? "bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20"
                        : "bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        {test.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-medium ${
                            test.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                          }`}
                        >
                          {test.name}
                        </h3>
                        <p
                          className={`text-sm ${
                            test.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {test.message}
                        </p>
                        {test.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Duration: {(test.duration / 1000).toFixed(2)}s
                          </p>
                        )}

                        {test.details && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer">Details</summary>
                            <pre className="text-xs mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded overflow-auto max-h-40">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
