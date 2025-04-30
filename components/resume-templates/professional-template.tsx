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

interface ProfessionalTemplateProps {
  data: ResumeData
  className?: string
}

export function ProfessionalTemplate({ data, className = "" }: ProfessionalTemplateProps) {
  return (
    <div className={`font-serif text-slate-800 dark:text-slate-200 ${className}`}>
      {/* Header */}
      <header className="text-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">{data.name || "Your Name"}</h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
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
            <h2 className="text-lg font-bold uppercase tracking-wider mb-2 border-b pb-1">{section.title}</h2>
            <div className="whitespace-pre-wrap">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
