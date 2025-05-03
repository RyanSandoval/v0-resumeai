"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ClientFileProcessor } from "@/components/client-file-processor"
import { useToast } from "@/hooks/use-toast"
import { Loader2, FileText, Upload, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { saveBaselineResume, getBaselineResume } from "@/app/actions/baseline-resume-actions"
import type { ResumeFile } from "@/components/resume-optimizer"

export function BaselineResumeManager() {
  const [resumeFile, setResumeFile] = useState<ResumeFile | null>(null)
  const [savedResume, setSavedResume] = useState<{ text: string; fileName: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadBaselineResume() {
      try {
        setIsLoading(true)
        const result = await getBaselineResume()
        if (result.success && result.resume) {
          setSavedResume({
            text: result.resume.resumeText,
            fileName: result.resume.fileName,
          })
        }
      } catch (error) {
        console.error("Error loading baseline resume:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBaselineResume()
  }, [])

  const handleFileSelected = (file: ResumeFile | null) => {
    setResumeFile(file)
  }

  const handleSaveBaseline = async () => {
    if (!resumeFile) {
      toast({
        title: "No resume selected",
        description: "Please upload a resume file first.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      const result = await saveBaselineResume({
        resumeText: resumeFile.text,
        fileType: resumeFile.type,
        fileName: resumeFile.file.name,
      })

      if (result.success) {
        setSavedResume({
          text: resumeFile.text,
          fileName: resumeFile.file.name,
        })
        setResumeFile(null)
        toast({
          title: "Baseline resume saved",
          description: "Your baseline resume has been saved successfully.",
        })
      } else {
        toast({
          title: "Error saving resume",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving baseline resume:", error)
      toast({
        title: "Error saving resume",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Baseline Resume</CardTitle>
        <CardDescription>Upload your baseline resume once and use it for all future optimizations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : savedResume ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-md">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{savedResume.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {savedResume.text.length} characters • Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="ml-auto flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="ml-2 text-sm font-medium text-green-500">Saved</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Want to update your baseline resume?</p>
            </div>
            <ClientFileProcessor onFileSelected={handleFileSelected} selectedFile={resumeFile} />
            {resumeFile && (
              <Button onClick={handleSaveBaseline} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update Baseline Resume
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-md">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-medium">No baseline resume</p>
                <p className="text-sm text-muted-foreground">Upload a resume to save as your baseline</p>
              </div>
            </div>
            <ClientFileProcessor onFileSelected={handleFileSelected} selectedFile={resumeFile} />
            {resumeFile && (
              <Button onClick={handleSaveBaseline} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Save as Baseline Resume
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
