"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { OptimizationResult } from "@/components/resume-optimizer"

interface ResumeComparisonProps {
  result: OptimizationResult
  jobDescription: string
}

export function ResumeComparison({ result, jobDescription }: ResumeComparisonProps) {
  const [activeTab, setActiveTab] = useState<"keywords" | "sections">("keywords")

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Resume Analysis</h3>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Job Description Keywords</h4>
              <div className="flex flex-wrap gap-1 mb-4">
                {result.keywords.matched.concat(result.keywords.missing).map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className={`${
                      result.keywords.matched.includes(keyword)
                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    }`}
                  >
                    {keyword}
                    {result.keywords.matched.includes(keyword) && " ✓"}
                  </Badge>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Keyword Match</span>
                  <span className="font-medium">
                    {result.keywords.matched.length}/{result.keywords.matched.length + result.keywords.missing.length}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {result.keywords.matched.length > 0
                    ? `Your resume already includes ${result.keywords.matched.length} relevant keywords.`
                    : "Your resume doesn't include any of the identified keywords."}
                  {result.keywords.missing.length > 0
                    ? ` We've added ${result.keywords.missing.length} missing keywords to your optimized resume.`
                    : ""}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="mt-4">
            <div className="space-y-4">
              {["summary", "experience", "skills", "education", "projects"].map((section) => {
                const sectionChanges = result.changes.filter((change) => change.section.toLowerCase() === section)

                return (
                  <div key={section} className="space-y-2">
                    <h4 className="text-sm font-medium capitalize">{section}</h4>
                    {sectionChanges.length > 0 ? (
                      <ul className="text-xs space-y-1">
                        {sectionChanges.map((change, idx) => (
                          <li key={idx} className="text-slate-600 dark:text-slate-300">
                            • {change.description}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">No changes recommended for this section.</p>
                    )}
                    <Separator className="mt-2" />
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
