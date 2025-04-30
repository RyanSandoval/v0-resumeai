"use client"

import { useTemplate } from "@/contexts/template-context"
import { ProfessionalTemplate } from "./professional-template"
import { ModernTemplate } from "./modern-template"
import { CreativeTemplate } from "./creative-template"
import { MinimalTemplate } from "./minimal-template"
import { ExecutiveTemplate } from "./executive-template"
import { parseResumeText } from "@/lib/resume-parser"

interface TemplateRendererProps {
  resumeText: string
  className?: string
}

export function TemplateRenderer({ resumeText, className = "" }: TemplateRendererProps) {
  const { selectedTemplate } = useTemplate()
  const resumeData = parseResumeText(resumeText)

  switch (selectedTemplate.id) {
    case "professional":
      return <ProfessionalTemplate data={resumeData} className={className} />
    case "modern":
      return <ModernTemplate data={resumeData} className={className} />
    case "creative":
      return <CreativeTemplate data={resumeData} className={className} />
    case "minimal":
      return <MinimalTemplate data={resumeData} className={className} />
    case "executive":
      return <ExecutiveTemplate data={resumeData} className={className} />
    default:
      return <ProfessionalTemplate data={resumeData} className={className} />
  }
}
