"use client"

interface ResumeSection {
  title: string
  content: string
}

interface ResumeData {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  website?: string
  sections: ResumeSection[]
}

interface MinimalTemplateProps {
  data: ResumeData
  className?: string
}

export function MinimalTemplate({ data, className = "" }: MinimalTemplateProps) {
  return (
    <div className={`font-sans ${className}`}>
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{data.name || "Your Name"}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </header>

      {/* Sections */}
      <div className="space-y-6">
        {data.sections.map((section, index) => (
          <section key={index}>
            <h2 className="text-lg font-medium mb-2">{section.title}</h2>
            <div className="whitespace-pre-wrap">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
