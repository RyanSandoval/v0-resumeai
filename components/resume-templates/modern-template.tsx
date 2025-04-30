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

interface ModernTemplateProps {
  data: ResumeData
  className?: string
}

export function ModernTemplate({ data, className = "" }: ModernTemplateProps) {
  return (
    <div className={`font-sans ${className}`}>
      {/* Header */}
      <header className="bg-blue-600 dark:bg-blue-800 text-white p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{data.name || "Your Name"}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </header>

      {/* Sections */}
      <div className="space-y-6 px-6">
        {data.sections.map((section, index) => (
          <section key={index}>
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">{section.title}</h2>
            <div className="whitespace-pre-wrap">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
