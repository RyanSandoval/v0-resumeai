"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

interface KeywordsInputProps {
  keywords: string[]
  onChange: (keywords: string[]) => void
  placeholder?: string
  maxKeywords?: number
  disabled?: boolean
}

export function KeywordsInput({
  keywords,
  onChange,
  placeholder = "Add a keyword and press Enter",
  maxKeywords = 20,
  disabled = false,
}: KeywordsInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addKeyword = (keyword: string) => {
    // Normalize and trim the keyword
    const normalizedKeyword = keyword.trim().toLowerCase()

    // Validate the keyword
    if (!normalizedKeyword) {
      return
    }

    if (normalizedKeyword.length < 2) {
      setError("Keywords must be at least 2 characters long")
      return
    }

    if (keywords.map((k) => k.toLowerCase()).includes(normalizedKeyword)) {
      setError("This keyword has already been added")
      return
    }

    if (keywords.length >= maxKeywords) {
      setError(`You can only add up to ${maxKeywords} keywords`)
      return
    }

    // Clear any previous error
    setError(null)

    // Add the keyword and reset input
    onChange([...keywords, normalizedKeyword])
    setInputValue("")
  }

  const removeKeyword = (indexToRemove: number) => {
    onChange(keywords.filter((_, index) => index !== indexToRemove))
    // Clear any errors when removing keywords
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword(inputValue)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    // Clear error when user types
    if (error) setError(null)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Keywords</h2>

      <div className="space-y-2">
        <Label htmlFor="keywords">Enter relevant keywords for your target job</Label>
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            id="keywords"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => addKeyword(inputValue)}
            disabled={disabled || !inputValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
        {keywords.length === 0 ? (
          <p className="text-sm text-muted-foreground">No keywords added yet</p>
        ) : (
          keywords.map((keyword, index) => (
            <Badge
              key={`${keyword}-${index}`}
              variant="secondary"
              className="flex items-center gap-1 py-1.5 pl-3 pr-2 text-sm"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                disabled={disabled}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {keyword}</span>
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}

// Add default export to fix deployment error
export default KeywordsInput
