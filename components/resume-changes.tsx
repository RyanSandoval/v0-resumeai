"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Diff, DiffIcon as DiffDelete, DiffIcon as DiffAdd } from "lucide-react"

interface ResumeChangesProps {
  originalText: string
  optimizedText: string
  title?: string
}

export function ResumeChanges({ originalText, optimizedText, title = "Resume Changes" }: ResumeChangesProps) {
  // Simple diff visualization - in a real app you might want to use a more sophisticated diff algorithm
  const renderDiff = () => {
    if (!originalText || !optimizedText) {
      return <p className="text-gray-500 italic">No changes to display</p>
    }

    // Split text into paragraphs for easier comparison
    const originalParagraphs = originalText.split("\n").filter((p) => p.trim())
    const optimizedParagraphs = optimizedText.split("\n").filter((p) => p.trim())

    return (
      <div className="space-y-4">
        {optimizedParagraphs.map((paragraph, index) => {
          const isNew = !originalParagraphs.some((p) =>
            p.toLowerCase().includes(paragraph.toLowerCase().substring(0, 20)),
          )

          const isModified = !isNew && !originalParagraphs.includes(paragraph)

          return (
            <div key={index} className={`p-2 rounded-md ${isNew ? "bg-green-50" : isModified ? "bg-yellow-50" : ""}`}>
              {isNew && (
                <Badge variant="outline" className="mb-1 bg-green-100 text-green-800">
                  <DiffAdd className="h-3 w-3 mr-1" /> Added
                </Badge>
              )}
              {isModified && (
                <Badge variant="outline" className="mb-1 bg-yellow-100 text-yellow-800">
                  <Diff className="h-3 w-3 mr-1" /> Modified
                </Badge>
              )}
              <p>{paragraph}</p>
            </div>
          )
        })}

        {originalParagraphs.map((paragraph, index) => {
          const isRemoved = !optimizedParagraphs.some((p) =>
            p.toLowerCase().includes(paragraph.toLowerCase().substring(0, 20)),
          )

          if (isRemoved) {
            return (
              <div key={`removed-${index}`} className="p-2 rounded-md bg-red-50">
                <Badge variant="outline" className="mb-1 bg-red-100 text-red-800">
                  <DiffDelete className="h-3 w-3 mr-1" /> Removed
                </Badge>
                <p className="line-through text-gray-500">{paragraph}</p>
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{renderDiff()}</CardContent>
    </Card>
  )
}
