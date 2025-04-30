"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type ResumeTemplate = {
  id: string
  name: string
  description: string
  thumbnail: string
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "professional",
    name: "Professional",
    description: "A clean, traditional template suitable for most industries",
    thumbnail: "/templates/professional-thumb.png",
  },
  {
    id: "modern",
    name: "Modern",
    description: "A contemporary design with a touch of color",
    thumbnail: "/templates/modern-thumb.png",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Bold design for creative industries",
    thumbnail: "/templates/creative-thumb.png",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant with focus on content",
    thumbnail: "/templates/minimal-thumb.png",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Sophisticated design for senior positions",
    thumbnail: "/templates/executive-thumb.png",
  },
]

type TemplateContextType = {
  templates: ResumeTemplate[]
  selectedTemplate: ResumeTemplate
  setSelectedTemplate: (template: ResumeTemplate) => void
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined)

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>(RESUME_TEMPLATES[0])
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true once component is mounted
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load saved template preference from localStorage if available
  useEffect(() => {
    if (isClient) {
      const savedTemplateId = localStorage.getItem("selectedResumeTemplate")
      if (savedTemplateId) {
        const template = RESUME_TEMPLATES.find((t) => t.id === savedTemplateId)
        if (template) {
          setSelectedTemplate(template)
        }
      }
    }
  }, [isClient])

  // Save template preference to localStorage when changed
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("selectedResumeTemplate", selectedTemplate.id)
    }
  }, [selectedTemplate, isClient])

  return (
    <TemplateContext.Provider
      value={{
        templates: RESUME_TEMPLATES,
        selectedTemplate,
        setSelectedTemplate,
      }}
    >
      {children}
    </TemplateContext.Provider>
  )
}

export function useTemplate() {
  const context = useContext(TemplateContext)
  if (context === undefined) {
    throw new Error("useTemplate must be used within a TemplateProvider")
  }
  return context
}
