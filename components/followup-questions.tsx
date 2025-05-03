"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { HelpCircle, ChevronDown, ChevronUp, Send } from "lucide-react"

interface FollowupQuestionsProps {
  questions: string[]
}

export function FollowupQuestions({ questions }: FollowupQuestionsProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const handleToggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index)
  }

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers({ ...answers, [index]: value })
  }

  const handleSubmitAnswer = (index: number) => {
    // In a real implementation, this would send the answer to the backend
    // For now, we'll just clear the answer and collapse the question
    setAnswers({ ...answers, [index]: "" })
    setExpandedQuestion(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-2">
        Answer these questions to further improve your resume optimization
      </p>

      {questions.map((question, index) => (
        <div key={index} className="border rounded-md overflow-hidden transition-all duration-200">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
            onClick={() => handleToggleQuestion(index)}
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{question}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {expandedQuestion === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {expandedQuestion === index && (
            <div className="p-3 border-t bg-muted/30">
              <Textarea
                placeholder="Type your answer here..."
                value={answers[index] || ""}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                className="mb-2"
                rows={3}
              />
              <Button
                size="sm"
                onClick={() => handleSubmitAnswer(index)}
                disabled={!answers[index]}
                className="flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Submit Answer
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
