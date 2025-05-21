import { JobUrlDiagnostics } from "@/components/job-url-diagnostics"

export default function TestJobUrlPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Job URL Testing Tool</h1>
      <JobUrlDiagnostics />
    </div>
  )
}
