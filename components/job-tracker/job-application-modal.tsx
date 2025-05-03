"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { createJobApplication, updateJobApplication } from "@/app/actions/job-tracker-actions"
import { JobDescriptionInput } from "@/components/job-description-input"

type JobApplication = {
  id: string
  title: string
  company: string | null
  jobDescription: string | null
  jobUrl: string | null
  status: string
  resumeId: string | null
  notes: string | null
  appliedDate: Date | null
  createdAt: Date
  updatedAt: Date
}

interface JobApplicationModalProps {
  isOpen: boolean
  onClose: (refreshData: boolean) => void
  job: JobApplication | null
}

export function JobApplicationModal({ isOpen, onClose, job }: JobApplicationModalProps) {
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [jobUrl, setJobUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [appliedDate, setAppliedDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (job) {
      setTitle(job.title)
      setCompany(job.company || "")
      setJobDescription(job.jobDescription || "")
      setJobUrl(job.jobUrl || "")
      setNotes(job.notes || "")
      setAppliedDate(job.appliedDate ? new Date(job.appliedDate) : undefined)
    } else {
      resetForm()
    }
  }, [job, isOpen])

  const resetForm = () => {
    setTitle("")
    setCompany("")
    setJobDescription("")
    setJobUrl("")
    setNotes("")
    setAppliedDate(undefined)
  }

  const handleSubmit = async () => {
    if (!title) {
      toast({
        title: "Job title required",
        description: "Please enter a job title",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (job) {
        // Update existing job
        const result = await updateJobApplication({
          id: job.id,
          title,
          company,
          jobDescription,
          jobUrl,
          notes,
          appliedDate: appliedDate || null,
        })

        if (result.success) {
          toast({
            title: "Job updated",
            description: "The job application has been updated successfully",
          })
          onClose(true)
        } else {
          toast({
            title: "Error updating job",
            description: result.error || "Failed to update job application",
            variant: "destructive",
          })
        }
      } else {
        // Create new job
        const result = await createJobApplication({
          title,
          company,
          jobDescription,
          jobUrl,
          notes,
          appliedDate: appliedDate || null,
        })

        if (result.success) {
          toast({
            title: "Job added",
            description: "The job application has been added successfully",
          })
          onClose(true)
        } else {
          toast({
            title: "Error adding job",
            description: result.error || "Failed to add job application",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error submitting job:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? "Edit Job Application" : "Add Job Application"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Software Engineer"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="jobUrl">Job URL</Label>
            <Input
              id="jobUrl"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://example.com/job/123"
              type="url"
            />
          </div>

          <div className="grid gap-2">
            <Label>Applied Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !appliedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {appliedDate ? format(appliedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={appliedDate} onSelect={setAppliedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="jobDescription">Job Description</Label>
            <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this application"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {job ? "Updating..." : "Adding..."}
              </>
            ) : job ? (
              "Update Job"
            ) : (
              "Add Job"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
