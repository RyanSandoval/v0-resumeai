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

interface ExecutiveTemplateProps {
  data: ResumeData
  className?: string
}

export function ExecutiveTemplate({ data, className = "" }: ExecutiveTemplateProps) {
  return (
    <div className={`font-serif ${className}`}>
      {/* Header */}
      <header className="text-center mb-8 border-b-2 border-slate-800 dark:border-slate-200 pb-4">
        <h1 className="text-3xl font-bold mb-2">{data.name || "Your Name"}</h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </header>

      {/* Sections */}
      <div className="space-y-8">
        {data.sections.map((section, index) => (
          <section key={index}>
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {section.title}
            </h2>
            <div className="whitespace-pre-wrap">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
