"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, ExternalLink, Trash2, Edit2, FileText } from "lucide-react"
import { deleteResume, updateResumeTitle } from "@/app/actions/resume-actions"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface SavedResumesListProps {
  resumes: any[]
}

export function SavedResumesList({ resumes }: SavedResumesListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    const { success } = await deleteResume(id)
    if (success) {
      setIsDeleting(null)
    }
  }

  const handleEdit = (id: string, currentTitle: string) => {
    setIsEditing(id)
    setNewTitle(currentTitle)
  }

  const handleUpdateTitle = async () => {
    if (!isEditing) return

    setIsSubmitting(true)
    const { success } = await updateResumeTitle(isEditing, newTitle)
    setIsSubmitting(false)

    if (success) {
      setIsEditing(null)
    }
  }

  if (resumes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-medium mb-2">No resumes saved yet</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Optimize and save your resumes to see them here</p>
        <Button onClick={() => router.push("/")}>Create New Resume</Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resumes.map((resume) => (
        <Card key={resume.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-start">
              <span className="text-lg font-semibold truncate">{resume.title}</span>
              <Badge variant="outline" className="ml-2 shrink-0">
                {resume.score}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Created {formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}
              </div>

              {resume.jobUrl && (
                <div className="flex items-center text-sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-1 text-blue-600 dark:text-blue-400" />
                  <a
                    href={resume.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                  >
                    {resume.jobUrl}
                  </a>
                </div>
              )}

              <div className="flex flex-wrap gap-1 mt-2">
                {resume.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {resume.keywords.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{resume.keywords.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(resume.id, resume.title)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Rename
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(resume.id)}
                disabled={isDeleting === resume.id}
              >
                {isDeleting === resume.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
              <Button size="sm" asChild>
                <Link href={`/resume/${resume.id}`}>View</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}

      <Dialog open={isEditing !== null} onOpenChange={(open) => !open && setIsEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>Enter a new title for your resume</DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Resume Title"
            className="mt-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTitle} disabled={isSubmitting || !newTitle.trim()}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
