import { getSession } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EnhancedResumeOptimizer from "@/components/enhanced-resume-optimizer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertTriangle, Upload } from "lucide-react"

export default async function OptimizePage({
  searchParams,
}: {
  searchParams: { resumeId?: string; jobId?: string }
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/optimize")
  }

  const { resumeId, jobId } = searchParams

  if (!resumeId) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Resume Optimizer</h1>
          <p className="text-muted-foreground">
            Upload your resume and a job description to get personalized optimization suggestions
          </p>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Missing Resume</AlertTitle>
          <AlertDescription>
            You need to select a resume to optimize. Please upload or select a resume first.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button asChild size="lg" className="flex items-center gap-2">
            <Link href="/dashboard">
              <Upload className="h-5 w-5" />
              Upload or Select Resume
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Fetch the resume data
  const resume = await prisma.resume.findUnique({
    where: {
      id: resumeId,
      userId: session.user.id,
    },
  })

  if (!resume) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Resume Optimizer</h1>
          <p className="text-muted-foreground">
            Upload your resume and a job description to get personalized optimization suggestions
          </p>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Resume Not Found</AlertTitle>
          <AlertDescription>
            The selected resume could not be found. Please try again with a different resume.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Parse the resume data
  const resumeData = JSON.parse(resume.content)

  // Fetch job description if jobId is provided
  let jobDescription = ""

  if (jobId) {
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
        userId: session.user.id,
      },
    })

    if (job) {
      jobDescription = job.description
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Resume Optimizer</h1>
        <p className="text-muted-foreground">
          Upload your resume and a job description to get personalized optimization suggestions
        </p>
      </div>

      <EnhancedResumeOptimizer resumeData={resumeData} jobDescription={jobDescription} />
    </div>
  )
}
