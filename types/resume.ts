export interface ResumeData {
  profile?: string
  skills?: string[]
  experience?: {
    title: string
    company: string
    startDate: string
    endDate: string
    description?: string
  }[]
  education?: {
    degree: string
    field: string
    institution: string
    graduationDate: string
    description?: string
  }[]
}
