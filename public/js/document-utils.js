/**
 * Document Utilities for Resume Optimizer
 * Handles extraction of text from various document formats
 */

;(() => {
  /**
   * Extracts text from a file based on its type
   * @param {File} file - The file to extract text from
   * @returns {Promise<string>} - The extracted text
   */
  async function extractTextFromFile(file) {
    if (!file) {
      throw new Error("No file provided")
    }

    const fileExtension = file.name.split(".").pop().toLowerCase()

    switch (fileExtension) {
      case "pdf":
        return await extractTextFromPDF(file)
      case "doc":
      case "docx":
        return await extractTextFromDOCX(file)
      case "txt":
        return await extractTextFromTXT(file)
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  }

  /**
   * Extracts text from a PDF file
   * @param {File} file - The PDF file
   * @returns {Promise<string>} - The extracted text
   */
  async function extractTextFromPDF(file) {
    try {
      // For simplicity in this demo, we'll just read the file as text
      // In a real implementation, you would use a PDF parsing library
      console.log("Extracting text from PDF:", file.name)

      // Simulate PDF processing
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Return a placeholder text for demo purposes
      return `RESUME
      
John Doe
123 Main St, Anytown, USA
john.doe@example.com | (555) 123-4567

SUMMARY
Experienced software developer with 5+ years of expertise in web development, 
JavaScript frameworks, and cloud technologies.

EXPERIENCE
Senior Developer, Tech Company Inc.
Jan 2020 - Present
• Led development of customer-facing web applications using React and Node.js
• Improved application performance by 40% through code optimization
• Mentored junior developers and conducted code reviews

Developer, Digital Solutions LLC
Mar 2017 - Dec 2019
• Developed and maintained multiple web applications
• Implemented responsive designs using HTML5, CSS3, and JavaScript
• Collaborated with UX designers to improve user experience

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2017

SKILLS
• Programming: JavaScript, TypeScript, Python, Java
• Frontend: React, Angular, Vue.js, HTML5, CSS3
• Backend: Node.js, Express, Django, Spring Boot
• Database: MongoDB, PostgreSQL, MySQL
• Tools: Git, Docker, AWS, Azure, CI/CD pipelines`
    } catch (error) {
      console.error("Error extracting text from PDF:", error)
      throw new Error("Failed to extract text from PDF. Please try another file.")
    }
  }

  /**
   * Extracts text from a DOCX file
   * @param {File} file - The DOCX file
   * @returns {Promise<string>} - The extracted text
   */
  async function extractTextFromDOCX(file) {
    try {
      console.log("Extracting text from DOCX:", file.name)

      // Simulate DOCX processing
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Return a placeholder text for demo purposes
      return `RESUME
      
Jane Smith
456 Oak Ave, Somewhere, USA
jane.smith@example.com | (555) 987-6543

SUMMARY
Detail-oriented project manager with 7+ years of experience leading cross-functional teams
and delivering complex projects on time and under budget.

EXPERIENCE
Senior Project Manager, Global Enterprises
Jun 2018 - Present
• Managed projects with budgets exceeding $1M, consistently delivering on time
• Led cross-functional teams of 15+ members across multiple departments
• Implemented new project management methodologies, reducing delivery time by 25%

Project Coordinator, Business Solutions Co.
Aug 2015 - May 2018
• Assisted in the planning and execution of multiple concurrent projects
• Developed project documentation and maintained communication with stakeholders
• Coordinated resources and schedules to ensure project milestones were met

EDUCATION
Master of Business Administration
Business University, 2015

Bachelor of Arts in Communications
State University, 2012

SKILLS
• Project Management: Agile, Scrum, Waterfall, PRINCE2
• Tools: JIRA, Asana, Microsoft Project, Trello
• Technical: Microsoft Office Suite, Google Workspace, Tableau
• Soft Skills: Leadership, Communication, Problem-solving, Negotiation`
    } catch (error) {
      console.error("Error extracting text from DOCX:", error)
      throw new Error("Failed to extract text from DOCX. Please try another file.")
    }
  }

  /**
   * Extracts text from a TXT file
   * @param {File} file - The TXT file
   * @returns {Promise<string>} - The extracted text
   */
  async function extractTextFromTXT(file) {
    try {
      return await file.text()
    } catch (error) {
      console.error("Error extracting text from TXT:", error)
      throw new Error("Failed to extract text from TXT. Please try another file.")
    }
  }

  // Expose functions to global scope
  window.extractTextFromFile = extractTextFromFile
  window.extractTextFromPDF = extractTextFromPDF
  window.extractTextFromDOCX = extractTextFromDOCX
  window.extractTextFromTXT = extractTextFromTXT
})()
