"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { JobPostingData } from "@/app/actions/extract-job-posting"

interface ManualJobInputProps {
  onJobDataEntered: (jobData: JobPostingData) => void
}

export function ManualJobInput({ onJobDataEntered }: ManualJobInputProps) {
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [location, setLocation] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title) {
      setError("Please enter a job title")
      return
    }

    if (!jobDescription) {
      setError("Please enter a job description")
      return
    }

    setError(null)

    // Create job data object
    const jobData: JobPostingData = {
      title,
      company,
      location,
      jobDescription,
      requiredSkills: extractPotentialSkills(jobDescription),
      jobType: null,
      salary: null,
      postDate: null,
      applicationUrl: null,
      source: "Manual Entry",
    }

    // Pass data to parent component
    onJobDataEntered(jobData)
    setSuccess(true)

    // Reset form after 2 seconds
    setTimeout(() => {
      setSuccess(false)
    }, 2000)
  }

  // Simple function to extract potential skills from job description
  const extractPotentialSkills = (text: string): string[] => {
    const techSkills = [
      "JavaScript",
      "TypeScript",
      "React",
      "Angular",
      "Vue",
      "Node.js",
      "Python",
      "Java",
      "C#",
      "C++",
      "Ruby",
      "PHP",
      "Swift",
      "Kotlin",
      "Go",
      "Rust",
      "SQL",
      "NoSQL",
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Redis",
      "Docker",
      "Kubernetes",
      "AWS",
      "Azure",
      "GCP",
      "Git",
      "CI/CD",
      "Agile",
      "Scrum",
      "REST",
      "GraphQL",
      "HTML",
      "CSS",
      "Sass",
      "LESS",
      "Webpack",
      "Babel",
      "Jest",
      "Mocha",
      "Cypress",
      "Selenium",
      "TDD",
      "BDD",
      "DevOps",
      "Linux",
      "Unix",
      "Windows",
      "MacOS",
    ]

    const foundSkills: string[] = []
    const lowerText = text.toLowerCase()

    techSkills.forEach((skill) => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill)
      }
    })

    return foundSkills
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Job Entry</CardTitle>
        <CardDescription>Enter job details manually if automatic extraction doesn't work</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job Title *</Label>
            <Input
              id="job-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corporation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote, New York, NY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-description">Job Description *</Label>
            <Textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Job details have been successfully entered</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full">
            Submit Job Details
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
