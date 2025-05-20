"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { EditableResume } from "@/components/editable-resume"
import { calculateMatchScore } from "@/lib/resume-optimizer"
import { CheckCircle2, AlertCircle } from "lucide-react"

// Sample data for testing
const SAMPLE_RESUME = `JOHN DOE
123 Main Street, City, State 12345
(123) 456-7890 | john.doe@email.com | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies.

SKILLS
JavaScript, TypeScript, React, Node.js, AWS, Docker, MongoDB, PostgreSQL

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
• Led the development of a customer-facing portal that improved user engagement by 35%
• Architected and implemented microservices architecture, reducing system latency by 40%

Software Engineer | WebSolutions LLC | Mar 2018 - Dec 2020
• Developed RESTful APIs and integrated third-party services for e-commerce platform
• Implemented responsive UI components using React and Material UI

EDUCATION
Bachelor of Science in Computer Science
University of Technology | Graduated: May 2016
• GPA: 3.8/4.0
• Relevant coursework: Data Structures, Algorithms, Web Development`

const SAMPLE_JOB_DESCRIPTION = `
We are seeking a Senior Full Stack Developer with strong experience in modern web technologies.

Required Skills:
- 5+ years of experience with JavaScript and TypeScript
- Strong proficiency in React.js and Node.js
- Experience with cloud platforms (AWS, Azure, or GCP)
- Knowledge of database systems (SQL and NoSQL)
- Experience with containerization technologies like Docker and Kubernetes
- Strong problem-solving skills and attention to detail

Responsibilities:
- Develop and maintain web applications using React.js and Node.js
- Collaborate with cross-functional teams to define and implement new features
- Optimize applications for maximum speed and scalability
- Implement security and data protection measures
`

export default function ResumeEditorTest() {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME)
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB_DESCRIPTION)
  const [testResults, setTestResults] = useState<Array<{ name: string; passed: boolean; message: string }>>([])
  const [activeTab, setActiveTab] = useState("editor")

  // Run tests when component mounts
  useEffect(() => {
    runTests()
  }, [])

  // Run tests on the resume editor
  const runTests = () => {
    const results = []

    // Test 1: Resume text is properly initialized
    results.push({
      name: "Resume Initialization",
      passed: resumeText === SAMPLE_RESUME,
      message:
        resumeText === SAMPLE_RESUME ? "Resume text properly initialized" : "Resume text not properly initialized",
    })

    // Test 2: Job description is properly initialized
    results.push({
      name: "Job Description Initialization",
      passed: jobDescription === SAMPLE_JOB_DESCRIPTION,
      message:
        jobDescription === SAMPLE_JOB_DESCRIPTION
          ? "Job description properly initialized"
          : "Job description not properly initialized",
    })

    // Test 3: Score calculation works
    const keywords = ["JavaScript", "TypeScript", "React", "Node.js", "AWS", "Docker"]
    const matched = keywords.filter((keyword) => resumeText.toLowerCase().includes(keyword.toLowerCase()))
    const score = calculateMatchScore(matched.length, keywords.length)

    results.push({
      name: "Score Calculation",
      passed: score > 0 && score <= 100,
      message: score > 0 && score <= 100 ? `Score calculation works: ${score}` : `Score calculation failed: ${score}`,
    })

    setTestResults(results)
  }

  // Handle resume text update
  const handleResumeUpdate = (updatedText: string) => {
    setResumeText(updatedText)
    runTests()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Editor Component Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="inputs">Test Inputs</TabsTrigger>
              <TabsTrigger value="results">Test Results</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <EditableResume
                result={{
                  originalText: SAMPLE_RESUME,
                  optimizedText: resumeText,
                  jobDescription: jobDescription,
                  score: 85,
                  keywords: {
                    matched: ["JavaScript", "React", "Node.js", "AWS", "Docker"],
                    missing: ["Kubernetes", "Azure", "GCP"],
                  },
                  changes: [
                    {
                      type: "addition",
                      section: "Skills",
                      description: "Added missing keywords",
                    },
                  ],
                }}
                jobDescription={jobDescription}
                onUpdate={handleResumeUpdate}
              />
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Resume Text</h3>
                  <Textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Job Description</h3>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <Button onClick={runTests}>Run Tests</Button>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Test Results</h3>
                  <Badge variant="outline">
                    {testResults.filter((r) => r.passed).length}/{testResults.length} Passed
                  </Badge>
                </div>

                {testResults.map((result, index) => (
                  <Alert key={index} variant={result.passed ? "default" : "destructive"}>
                    {result.passed ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{result.name}</AlertTitle>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
