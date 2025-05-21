/**
 * Resume Optimizer Testing Utility
 * Provides comprehensive testing for the resume optimization feature
 */
import { fileProcessingService } from "../services/file-processing-service"
import { resumeAnalysisService } from "../services/resume-analysis-service"

export interface TestResult {
  name: string
  success: boolean
  message: string
  details?: any
  duration?: number
}

export interface TestSuite {
  name: string
  tests: TestResult[]
  duration: number
  passCount: number
  failCount: number
}

export class ResumeOptimizerTester {
  /**
   * Run a comprehensive test suite for the resume optimizer
   */
  public async runTests(): Promise<TestSuite> {
    const startTime = performance.now()
    const tests: TestResult[] = []

    // Run file processing tests
    const fileProcessingTests = await this.runFileProcessingTests()
    tests.push(...fileProcessingTests)

    // Run resume analysis tests
    const analysisTests = await this.runAnalysisTests()
    tests.push(...analysisTests)

    // Run integration tests
    const integrationTests = await this.runIntegrationTests()
    tests.push(...integrationTests)

    const duration = performance.now() - startTime
    const passCount = tests.filter((t) => t.success).length
    const failCount = tests.length - passCount

    return {
      name: "Resume Optimizer Test Suite",
      tests,
      duration,
      passCount,
      failCount,
    }
  }

  /**
   * Run tests for file processing
   */
  private async runFileProcessingTests(): Promise<TestResult[]> {
    const tests: TestResult[] = []

    // Test PDF processing
    tests.push(await this.testFileProcessing("pdf"))

    // Test DOCX processing
    tests.push(await this.testFileProcessing("docx"))

    // Test TXT processing
    tests.push(await this.testFileProcessing("txt"))

    // Test invalid file
    tests.push(await this.testInvalidFile())

    // Test empty file
    tests.push(await this.testEmptyFile())

    return tests
  }

  /**
   * Run tests for resume analysis
   */
  private async runAnalysisTests(): Promise<TestResult[]> {
    const tests: TestResult[] = []

    // Test basic analysis
    tests.push(await this.testBasicAnalysis())

    // Test analysis with keywords
    tests.push(await this.testAnalysisWithKeywords())

    // Test analysis with different options
    tests.push(await this.testAnalysisWithOptions())

    // Test analysis with invalid input
    tests.push(await this.testInvalidAnalysisInput())

    return tests
  }

  /**
   * Run integration tests
   */
  private async runIntegrationTests(): Promise<TestResult[]> {
    const tests: TestResult[] = []

    // Test end-to-end flow
    tests.push(await this.testEndToEndFlow())

    return tests
  }

  /**
   * Test file processing for a specific file type
   */
  private async testFileProcessing(fileType: string): Promise<TestResult> {
    const startTime = performance.now()

    try {
      // Create a mock file
      const mockContent = this.getMockResumeContent()
      const mockFile = new File([mockContent], `test-resume.${fileType}`, {
        type:
          fileType === "pdf"
            ? "application/pdf"
            : fileType === "docx"
              ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "text/plain",
      })

      // Process the file
      const result = await fileProcessingService.processFile(mockFile)

      const duration = performance.now() - startTime

      if (result.success && result.text && result.text.length > 100) {
        return {
          name: `Process ${fileType.toUpperCase()} File`,
          success: true,
          message: `Successfully processed ${fileType.toUpperCase()} file`,
          details: {
            textLength: result.text.length,
            metadata: result.metadata,
          },
          duration,
        }
      } else {
        return {
          name: `Process ${fileType.toUpperCase()} File`,
          success: false,
          message: `Failed to process ${fileType.toUpperCase()} file: ${result.error?.message || "Unknown error"}`,
          details: result.error,
          duration,
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime

      return {
        name: `Process ${fileType.toUpperCase()} File`,
        success: false,
        message: `Error processing ${fileType.toUpperCase()} file: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
        duration,
      }
    }
  }

  /**
   * Test processing an invalid file
   */
  private async testInvalidFile(): Promise<TestResult> {
    const startTime = performance.now()

    try {
      // Create an invalid file
      const mockContent = "This is not a valid resume file"
      const mockFile = new File([mockContent], "test-resume.xyz", { type: "application/octet-stream" })

      // Process the file
      const result = await fileProcessingService.processFile(mockFile)

      const duration = performance.now() - startTime

      // We expect this to fail with a specific error
      if (!result.success && result.error?.code === "FILE_FORMAT_ERROR") {
        return {
          name: "Process Invalid File",
          success: true, // Test passes if processing correctly identifies invalid file
          message: "Correctly identified invalid file format",
          details: {
            error: result.error,
          },
          duration,
        }
      } else {
        return {
          name: "Process Invalid File",
          success: false,
          message: "Failed to correctly identify invalid file format",
          details: result,
          duration,
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime

      // If it throws an error about invalid format, that's also acceptable
      if (error instanceof Error && error.message.toLowerCase().includes("format")) {
        return {
          name: "Process Invalid File",
          success: true,
          message: "Correctly rejected invalid file format with error",
          details: error,
          duration,
        }
      }

      return {
        name: "Process Invalid File",
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
        duration,
      }
    }
  }

  /**
   * Test processing an empty file
   */
  private async testEmptyFile(): Promise<TestResult> {
    const startTime = performance.now()

    try {
      // Create an empty file
      const mockFile = new File([""], "empty-resume.txt", { type: "text/plain" })

      // Process the file
      const result = await fileProcessingService.processFile(mockFile)

      const duration = performance.now() - startTime

      // We expect this to fail with a specific error
      if (
        !result.success &&
        (result.error?.code === "EMPTY_FILE_ERROR" || result.error?.message.toLowerCase().includes("empty"))
      ) {
        return {
          name: "Process Empty File",
          success: true, // Test passes if processing correctly identifies empty file
          message: "Correctly identified empty file",
          details: {
            error: result.error,
          },
          duration,
        }
      } else {
        return {
          name: "Process Empty File",
          success: false,
          message: "Failed to correctly identify empty file",
          details: result,
          duration,
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime

      // If it throws an error about empty file, that's also acceptable
      if (error instanceof Error && error.message.toLowerCase().includes("empty")) {
        return {
          name: "Process Empty File",
          success: true,
          message: "Correctly rejected empty file with error",
          details: error,
          duration,
        }
      }

      return {
        name: "Process Empty File",
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
        duration,
      }
    }
  }

  /**
   * Test basic resume analysis
   */
  private async testBasicAnalysis(): Promise<TestResult> {
    const startTime = performance.now()

    try {
      // Create test data
      const resumeText = this.getMockResumeContent()
      const jobDescription = this.getMockJobDescription()

      // Analyze resume
      const result = await resumeAnalysisService.analyzeResume({
        resumeText,
        jobDescription,
        options: {
          detailLevel: "moderate",
          prioritySections: ["experience", "skills", "education"],
          preserveFormatting: true,
          keywordDensity: "medium",
        },
      })

      const duration = performance.now() - startTime

      if (result.success && result.result) {
        return {
          name: "Basic Resume Analysis",
          success: true,
          message: "Successfully analyzed resume",
          details: {
            score: result.result.score,
            keywordCount: result.result.keywords.matched.length + result.result.keywords.missing.length,
            changesCount: result.result.changes.length,
            metadata: result.metadata,
          },
          duration,
        }
      } else {
        return {
          name: "Basic Resume Analysis",
          success: false,
          message: `Failed to analyze resume: ${result.error?.message || "Unknown error"}`,
          details: result.error,
          duration,
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime

      return {
        name: "Basic Resume Analysis",
        success: false,
        message: `Error analyzing resume: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
        duration,
      }
    }
  }

  /**
   * Test resume analysis with keywords
   */
  private async testAnalysisWithKeywords(): Promise<TestResult> {
    const startTime = performance.now()

    try {
      // Create test data
      const resumeText = this.getMockResumeContent()
      const keywords = ["JavaScript", "React", "Node.js", "TypeScript", "API"]

      // Analyze resume
      const result = await resumeAnalysisService.analyzeResume({
        resumeText,
        keywords,
        options: {
          detailLevel: "moderate",
          prioritySections: ["experience", "skills", "education"],
          preserveFormatting: true,
          keywordDensity: "medium",
        },
      })

      const duration = performance.now() - startTime

      if (result.success && result.result) {
        // Check if keywords were properly processed
        const allKeywords = [...result.result.keywords.matched, ...result.result.keywords.missing]
        const keywordsFound = keywords.every((k) => allKeywords.some((ak) => ak.toLowerCase() === k.toLowerCase()))

        if (keywordsFound) {
          return {
            name: "Resume Analysis with Keywords",
            success: true,
            message: "Successfully analyzed resume with keywords",
            details: {
              score: result.result.score,
              matchedKeywords: result.result.keywords.matched,
              missingKeywords: result.result.keywords.missing,
              metadata: result.metadata,
            },
            duration,
          }
        } else {
          return {
            name: "Resume Analysis with Keywords",
            success: false,
            message: "Keywords were not properly processed",
            details: {
              providedKeywords: keywords,
              resultKeywords: allKeywords,
            },
            duration,
          }
        }
      } else {
        return {
          name: "Resume Analysis with Keywords",
          success: false,
          message: `Failed to analyze resume with keywords: ${result.error?.message || "Unknown error"}`,
          details: result.error,
          duration,
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime

      return {
        name: "Resume Analysis with Keywords",
        success: false,
        message: `Error analyzing resume with keywords: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
        duration,
      }
    }
  }

  /**
   * Test resume analysis with different options
   */
  private async testAnalysisWithOptions(): Promise<TestResult> {
    const startTime = performance.now()

    try {
      // Create test data
      const resumeText = this.getMockResumeContent()
      const jobDescription = this.getMockJobDescription()

      // Analyze resume with detailed options
      const result = await resumeAnalysisService.analyzeResume({
        resumeText,
        jobDescription,
        options: {
          detailLevel: "detailed",
          prioritySections: ["summary", "skills"],
          preserveFormatting: false,
          keywordDensity: "high",
        },
      })

      const duration = performance.now() - startTime

      if (result.success && result.result) {
        // Check if options affected the result
        const prioritySectionsAddressed = result.result.changes.some(
          (c) => c.section.toLowerCase() === "summary" || c.section.toLowerCase() === "skills",
        )

        if (prioritySectionsAddressed) {
          return {
            name: "Resume Analysis with Options",
            success: true,
            message: "Successfully analyzed resume with custom options",
            details: {
              score: result.result.score,
              changes: result.result.changes,
              metadata: result.metadata,
            },
            duration,
          }
        } else {
          return {
            name: "Resume Analysis with Options",
            success: false,
            message: "Options did not affect the analysis result",
            details: {
              changes: result.result.changes,
            },
            duration,
          }
        }
      } else {
        return {
          name: "Resume Analysis with Options",
          success: false,
          message: `Failed to analyze resume with options: ${result.error?.message || "Unknown error"}`,
          details: result.error,
          duration,
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime

      return {
        name: "Resume Analysis with Options",
        success: false,
        message: `Error analyzing resume with options: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
        duration,
      }
    }
  }

  /**
   * Test resume analysis with invalid input
   */
  private async testInvalidAnalysisInput(): Promise<TestResult> {
    const startTime = performance.now()

    try {
      // Create invalid test data (empty resume)
      const resumeText = ""
      const jobDescription = this.getMockJobDescription()

      // Analyze resume
      const result = await resumeAnalysisService.analyzeResume({
        resumeText,
        jobDescription,
        options: {
          detailLevel: "moderate",
          prioritySections: ["experience", "skills", "education"],
          preserveFormatting: true,
          keywordDensity: "medium",
        },
      })

      const duration = performance.now() - startTime

      // We expect this to fail with a specific error
      if (!result.success && result.error) {
        return {
          name: "Resume Analysis with Invalid Input",
          success: true, // Test passes if analysis correctly identifies invalid input
          message: "Correctly identified invalid input",
          details: {
            error: result.error,
          },
          duration,
        }
      } else {
        return {
          name: "Resume Analysis with Invalid Input",
          success: false,
          message: "Failed to correctly identify invalid input",
          details: result,
          duration,
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime

      // If it throws an error about invalid input, that's also acceptable
      if (
        error instanceof Error &&
        (error.message.toLowerCase().includes("empty") ||
          error.message.toLowerCase().includes("short") ||
          error.message.toLowerCase().includes("required"))
      ) {
        return {
          name: "Resume Analysis with Invalid Input",
          success: true,
          message: "Correctly rejected invalid input with error",
          details: error,
          duration,
        }
      }

      return {
        name: "Resume Analysis with Invalid Input",
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
        duration,
      }
    }
  }

  /**
   * Test end-to-end flow
   */
  private async testEndToEndFlow(): Promise<TestResult> {
    const startTime = performance.now()

    try {
      // Step 1: Process a file
      const mockContent = this.getMockResumeContent()
      const mockFile = new File([mockContent], "test-resume.txt", { type: "text/plain" })

      const fileResult = await fileProcessingService.processFile(mockFile)

      if (!fileResult.success || !fileResult.text) {
        return {
          name: "End-to-End Flow",
          success: false,
          message: `File processing failed: ${fileResult.error?.message || "Unknown error"}`,
          details: fileResult.error,
          duration: performance.now() - startTime,
        }
      }

      // Step 2: Analyze the resume
      const jobDescription = this.getMockJobDescription()

      const analysisResult = await resumeAnalysisService.analyzeResume({
        resumeText: fileResult.text,
        jobDescription,
        options: {
          detailLevel: "moderate",
          prioritySections: ["experience", "skills", "education"],
          preserveFormatting: true,
          keywordDensity: "medium",
        },
      })

      const duration = performance.now() - startTime

      if (analysisResult.success && analysisResult.result) {
        return {
          name: "End-to-End Flow",
          success: true,
          message: "Successfully completed end-to-end flow",
          details: {
            fileProcessing: {
              textLength: fileResult.text.length,
              metadata: fileResult.metadata,
            },
            analysis: {
              score: analysisResult.result.score,
              keywordCount:
                analysisResult.result.keywords.matched.length + analysisResult.result.keywords.missing.length,
              changesCount: analysisResult.result.changes.length,
              metadata: analysisResult.metadata,
            },
          },
          duration,
        }
      } else {
        return {
          name: "End-to-End Flow",
          success: false,
          message: `Analysis failed: ${analysisResult.error?.message || "Unknown error"}`,
          details: analysisResult.error,
          duration,
        }
      }
    } catch (error) {
      const duration = performance.now() - startTime

      return {
        name: "End-to-End Flow",
        success: false,
        message: `Error in end-to-end flow: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
        duration,
      }
    }
  }

  /**
   * Get mock resume content for testing
   */
  private getMockResumeContent(): string {
    return `JOHN DOE
123 Main Street, City, State 12345
(123) 456-7890 | john.doe@email.com | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable applications and optimizing performance.

SKILLS
Programming Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Redux, HTML5, CSS3, SASS, Tailwind CSS
Backend: Node.js, Express, Django, Spring Boot
Databases: MongoDB, PostgreSQL, MySQL, Redis
Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD, GitHub Actions
Testing: Jest, React Testing Library, Cypress

EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
• Led the development of a customer-facing portal that improved user engagement by 35%
• Architected and implemented microservices architecture, reducing system latency by 40%
• Mentored junior developers and conducted code reviews to ensure code quality
• Collaborated with product managers to define and prioritize feature roadmaps

Software Engineer | WebSolutions LLC | Mar 2018 - Dec 2020
• Developed RESTful APIs and integrated third-party services for e-commerce platform
• Implemented responsive UI components using React and Material UI
• Optimized database queries, resulting in 25% faster page load times
• Participated in agile development process with bi-weekly sprints

Junior Developer | StartupTech | Jun 2016 - Feb 2018
• Built and maintained features for company's main web application
• Assisted in migrating legacy codebase to modern JavaScript frameworks
• Implemented automated testing, increasing code coverage from 45% to 80%

EDUCATION

Bachelor of Science in Computer Science
University of Technology | Graduated: May 2016
• GPA: 3.8/4.0
• Relevant coursework: Data Structures, Algorithms, Database Systems, Web Development

PROJECTS

Personal Finance Dashboard
• Developed a full-stack application for tracking expenses and visualizing spending patterns
• Technologies used: React, Node.js, Express, MongoDB, Chart.js

Open Source Contribution - DevTools Extension
• Created a browser extension to enhance developer productivity
• Implemented features for JSON formatting and local storage inspection

CERTIFICATIONS
• AWS Certified Developer - Associate
• MongoDB Certified Developer
• React Advanced Patterns Workshop`
  }

  /**
   * Get mock job description for testing
   */
  private getMockJobDescription(): string {
    return `Senior Frontend Developer

About the Role:
We are looking for a Senior Frontend Developer to join our growing team. The ideal candidate will have strong experience with modern JavaScript frameworks, particularly React, and a passion for creating exceptional user experiences.

Responsibilities:
- Develop and maintain responsive web applications using React and TypeScript
- Collaborate with designers to implement UI/UX designs with pixel-perfect accuracy
- Work with backend developers to integrate frontend with APIs and services
- Optimize applications for maximum speed and scalability
- Write clean, maintainable, and well-documented code
- Participate in code reviews and mentor junior developers
- Stay up-to-date with emerging trends and technologies in frontend development

Requirements:
- 5+ years of experience in frontend development
- Strong proficiency in JavaScript, HTML5, and CSS3
- 3+ years of experience with React and its ecosystem (Redux, React Router, etc.)
- Experience with TypeScript and modern JavaScript features
- Familiarity with responsive design and cross-browser compatibility
- Knowledge of frontend build tools and package managers (Webpack, npm, etc.)
- Understanding of RESTful APIs and GraphQL
- Experience with version control systems (Git)
- Strong problem-solving skills and attention to detail
- Excellent communication and teamwork abilities

Nice to Have:
- Experience with Next.js or other React frameworks
- Knowledge of testing frameworks (Jest, React Testing Library)
- Understanding of CI/CD pipelines
- Experience with state management libraries beyond Redux (MobX, Recoil, etc.)
- Familiarity with design systems and component libraries
- Experience with performance optimization techniques
- Contributions to open-source projects

Benefits:
- Competitive salary and benefits package
- Flexible work arrangements
- Professional development opportunities
- Collaborative and innovative work environment
- Modern tech stack and tools`
  }
}

// Export singleton instance
export const resumeOptimizerTester = new ResumeOptimizerTester()
