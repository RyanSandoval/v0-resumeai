"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, CheckCircle2, XCircle } from "lucide-react"
import { runResumeOptimizerTests, generateTestReport, type TestSuiteResults } from "@/lib/testing/resume-optimizer-test"

export default function ResumeTestRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<TestSuiteResults | null>(null)
  const [activeTab, setActiveTab] = useState("summary")
  const [testFiles, setTestFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reportFrameRef = useRef<HTMLIFrameElement>(null)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTestFiles(Array.from(e.target.files))
    }
  }

  // Run tests
  const runTests = async () => {
    if (testFiles.length === 0) {
      alert("Please select at least one test file")
      return
    }

    setIsRunning(true)
    setProgress(0)
    setResults(null)

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5
        return Math.min(prev + increment, 95)
      })
    }, 200)

    try {
      // Run tests
      const testResults = await runResumeOptimizerTests(testFiles)
      setResults(testResults)

      // Generate and display HTML report
      if (reportFrameRef.current) {
        const reportHtml = generateTestReport(testResults)
        const blob = new Blob([reportHtml], { type: "text/html" })
        reportFrameRef.current.src = URL.createObjectURL(blob)
      }

      // Set progress to 100%
      clearInterval(progressInterval)
      setProgress(100)
    } catch (error) {
      console.error("Test execution error:", error)
      clearInterval(progressInterval)
      setProgress(0)
    } finally {
      setIsRunning(false)
    }
  }

  // Reset tests
  const resetTests = () => {
    setResults(null)
    setProgress(0)
    setTestFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (reportFrameRef.current) {
      reportFrameRef.current.src = "about:blank"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Optimizer Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Test Files</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept=".pdf,.docx,.doc,.txt"
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                disabled={isRunning}
              />
              <p className="mt-1 text-xs text-slate-500">Select resume files to test (.pdf, .docx, .txt)</p>
            </div>

            {testFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Selected Files ({testFiles.length})</h3>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {testFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span>{file.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetTests} disabled={isRunning}>
                Reset
              </Button>
              <Button onClick={runTests} disabled={isRunning || testFiles.length === 0}>
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run Tests"
                )}
              </Button>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-slate-500">Running tests... {Math.round(progress)}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Test Results</CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant={results.passedTests === results.totalTests ? "default" : "destructive"}
                  className="text-xs"
                >
                  {results.passedTests}/{results.totalTests} Tests Passed
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {(results.duration / 1000).toFixed(2)}s
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="report">Detailed Report</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{results.totalTests}</div>
                        <p className="text-sm text-muted-foreground">Total Tests</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{results.passedTests}</div>
                        <p className="text-sm text-muted-foreground">Passed</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{results.failedTests}</div>
                        <p className="text-sm text-muted-foreground">Failed</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  {results.results
                    .filter((result) => !result.success)
                    .map((result, index) => (
                      <Alert key={index} variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>
                          {result.component}: {result.testName}
                        </AlertTitle>
                        <AlertDescription>{result.message}</AlertDescription>
                      </Alert>
                    ))}

                  {results.failedTests === 0 && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>All tests passed!</AlertTitle>
                      <AlertDescription>All {results.totalTests} tests completed successfully.</AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="report">
                <div className="border rounded-md h-[600px]">
                  <iframe
                    ref={reportFrameRef}
                    title="Test Report"
                    className="w-full h-full"
                    sandbox="allow-same-origin"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
