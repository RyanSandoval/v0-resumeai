"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check, X } from "lucide-react"

interface Keyword {
  keyword: string
  found: boolean
  importance: number // 1-10
}

interface KeywordAnalysisProps {
  keywords: Keyword[]
  matchRate: number
  title?: string
}

export function KeywordAnalysis({ keywords, matchRate, title = "Keyword Analysis" }: KeywordAnalysisProps) {
  // Sort keywords by importance (highest first) and then by found status
  const sortedKeywords = [...keywords].sort((a, b) => {
    if (a.found !== b.found) return b.found ? 1 : -1
    return b.importance - a.importance
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Keyword Match Rate</span>
            <span className="text-sm font-medium">{Math.round(matchRate)}%</span>
          </div>
          <Progress value={matchRate} className="h-2" />
        </div>

        <div className="space-y-2">
          {sortedKeywords.map((keyword, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
              <div className="flex items-center">
                {keyword.found ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={keyword.found ? "text-gray-900" : "text-gray-500"}>{keyword.keyword}</span>
              </div>
              <div className="flex items-center">
                <div className="flex space-x-0.5">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${i < keyword.importance ? "bg-blue-500" : "bg-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
