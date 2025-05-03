"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, ExternalLink, Calendar, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getJobApplications, updateJobStatus, deleteJobApplication } from "@/app/actions/job-tracker-actions"
import { JobApplicationModal } from "@/components/job-tracker/job-application-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

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

type Column = {
  id: string
  title: string
  description: string
  color: string
}

const columns: Column[] = [
  {
    id: "want_to_apply",
    title: "Want to Apply",
    description: "Jobs you're interested in",
    color: "bg-blue-500",
  },
  {
    id: "applied",
    title: "Applied",
    description: "Applications submitted",
    color: "bg-amber-500",
  },
  {
    id: "interview",
    title: "Interview",
    description: "Interview scheduled or in progress",
    color: "bg-green-500",
  },
  {
    id: "archived",
    title: "Archived",
    description: "Rejected or no longer interested",
    color: "bg-slate-500",
  },
]

export function JobBoard() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const result = await getJobApplications()
      if (result.success) {
        setJobs(result.jobs)
      } else {
        toast({
          title: "Error loading jobs",
          description: result.error || "Failed to load job applications",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading jobs:", error)
      toast({
        title: "Error loading jobs",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result

    // Dropped outside a droppable area
    if (!destination) return

    // Dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Update the job status in the UI immediately for a responsive feel
    const updatedJobs = [...jobs]
    const jobIndex = updatedJobs.findIndex((job) => job.id === draggableId)

    if (jobIndex !== -1) {
      updatedJobs[jobIndex] = {
        ...updatedJobs[jobIndex],
        status: destination.droppableId,
      }
      setJobs(updatedJobs)
    }

    // Update the job status in the database
    try {
      const result = await updateJobStatus(draggableId, destination.droppableId)

      if (!result.success) {
        // Revert the UI change if the update failed
        loadJobs()
        toast({
          title: "Error updating job status",
          description: result.error || "Failed to update job status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating job status:", error)
      // Revert the UI change if an error occurred
      loadJobs()
      toast({
        title: "Error updating job status",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleAddJob = () => {
    setSelectedJob(null)
    setIsModalOpen(true)
  }

  const handleEditJob = (job: JobApplication) => {
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      const result = await deleteJobApplication(jobId)

      if (result.success) {
        setJobs(jobs.filter((job) => job.id !== jobId))
        toast({
          title: "Job deleted",
          description: "The job application has been deleted",
        })
      } else {
        toast({
          title: "Error deleting job",
          description: result.error || "Failed to delete job application",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting job:", error)
      toast({
        title: "Error deleting job",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleModalClose = (refreshData: boolean) => {
    setIsModalOpen(false)
    if (refreshData) {
      loadJobs()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Application Tracker</h2>
        <Button onClick={handleAddJob}>
          <Plus className="h-4 w-4 mr-2" />
          Add Job
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {columns.map((column) => (
            <Card key={column.id} className="h-[500px]">
              <CardHeader className="pb-2">
                <div className={`w-full h-1 ${column.color} rounded-full mb-2`} />
                <CardTitle className="text-lg">{column.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[400px]">
                <div className="animate-pulse bg-slate-200 dark:bg-slate-700 w-full h-24 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {columns.map((column) => (
              <Card key={column.id} className="h-[500px]">
                <CardHeader className="pb-2">
                  <div className={`w-full h-1 ${column.color} rounded-full mb-2`} />
                  <CardTitle className="text-lg">{column.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-2 overflow-y-auto h-[430px]">
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 min-h-[400px]">
                        {jobs
                          .filter((job) => job.status === column.id)
                          .map((job, index) => (
                            <Draggable key={job.id} draggableId={job.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-sm border border-slate-200 dark:border-slate-700"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                      <h3 className="font-medium text-sm">{job.title}</h3>
                                      {job.company && <p className="text-xs text-muted-foreground">{job.company}</p>}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditJob(job)}>Edit</DropdownMenuItem>
                                        {job.jobUrl && (
                                          <DropdownMenuItem onClick={() => window.open(job.jobUrl!, "_blank")}>
                                            View Job
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteJob(job.id)}
                                          className="text-red-600 dark:text-red-400"
                                        >
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {job.appliedDate && (
                                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(job.appliedDate).toLocaleDateString()}
                                      </Badge>
                                    )}
                                    {job.jobUrl && (
                                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                                        <ExternalLink className="h-3 w-3" />
                                        Link
                                      </Badge>
                                    )}
                                    {job.resumeId && (
                                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        Resume
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Added {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            ))}
          </div>
        </DragDropContext>
      )}

      <JobApplicationModal isOpen={isModalOpen} onClose={handleModalClose} job={selectedJob} />
    </div>
  )
}
