"use client"

import type React from "react"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

interface KeywordsInputProps {
  keywords: string[]
  onChange: (keywords: string[]) => void
}

export function KeywordsInput({ keywords, onChange }: KeywordsInputProps) {
  const [inputValue, setInputValue] = useState("")

  const addKeyword = () => {
    if (inputValue.trim() && !keywords.includes(inputValue.trim())) {
      onChange([...keywords, inputValue.trim()])
      setInputValue("")
    }
  }

  const removeKeyword = (keyword: string) => {
    onChange(keywords.filter((k) => k !== keyword))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Keywords</h2>

      <div className="space-y-2">
        <Label htmlFor="keywords">Enter relevant keywords for your target job</Label>
        <div className="flex space-x-2">
          <Input
            id="keywords"
            placeholder="e.g., JavaScript, Project Management, Data Analysis"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={addKeyword} type="button" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
        {keywords.length > 0 ? (
          keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="px-3 py-1.5">
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Add keywords that are relevant to the job you're applying for.
          </p>
        )}
      </div>
    </div>
  )
}

// Add default export to fix deployment error
export default KeywordsInput
