"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PDFClientProcessor } from "@/components/pdf-client-processor"
import KeywordsInput from "@/components/keywords-input"
import OptimizationSettings from "@/components/optimization-settings"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function TestPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState<string>("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [optimizationSettings, setOptimizationSettings] = useState({
    detailLevel: "moderate" as const,
    prioritySections: ["experience", "skills"],
    preserveFormatting: true,
    keywordDensity: "medium" as const,
  })
  const [testPassed, setTestPassed] = useState<boolean | null>(null)
  const [testMessage, setTestMessage] = useState<string>("")

  const handleFileProcessed = (text: string, file: File) => {
    setResumeFile(file)
    setResumeText(text)
  }

  const testComponents = () => {
    try {
      // Test OptimizedImage component
      const imageElement = document.querySelector("[alt='Resume Optimizer Logo']")
      const imageLoaded = imageElement !== null

      // Test PDFClientProcessor
      const processorElement = document.querySelector(".pdf-client-processor")
      const processorExists = processorElement !== null
      const resumeUploaded = resumeText.length > 0

      // Test KeywordsInput
      const keywordInputExists = document.querySelector("[placeholder='Add a keyword and press Enter']") !== null
      const keywordsWorkCorrectly = keywords.length > 0

      // Test OptimizationSettings
      const settingsElement = document.querySelector("#detail-moderate")
      const settingsExist = settingsElement !== null

      // Determine if all tests passed
      const allPassed = imageLoaded && processorExists && keywordInputExists && settingsExist

      // Set test results
      setTestPassed(allPassed)
      setTestMessage(
        allPassed
          ? "All components are working correctly!"
          : `Issues found: ${!imageLoaded ? "Images not loading. " : ""}${
              !processorExists ? "PDF processor not working. " : ""
            }${!keywordInputExists ? "Keywords input not working. " : ""}${
              !settingsExist ? "Optimization settings not working. " : ""
            }`,
      )
    } catch (error) {
      setTestPassed(false)
      setTestMessage(`Test failed with error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Component Testing Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PDFClientProcessor onFileProcessed={handleFileProcessed} className="pdf-client-processor" />

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Test Keywords Input</h3>
            <KeywordsInput keywords={keywords} onChange={setKeywords} />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Test Optimization Settings</h3>
            <OptimizationSettings options={optimizationSettings} onChange={setOptimizationSettings} />
          </div>

          <div className="border-t pt-6 flex justify-center">
            <Button onClick={testComponents} size="lg">
              Run Component Tests
            </Button>
          </div>

          {testPassed !== null && (
            <Alert variant={testPassed ? "default" : "destructive"}>
              {testPassed ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{testPassed ? "Tests Passed" : "Tests Failed"}</AlertTitle>
              <AlertDescription>{testMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
