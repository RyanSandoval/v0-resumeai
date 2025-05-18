/**
 * Job Description Scraper
 * Extracts job descriptions from URLs
 */

;(() => {
  /**
   * Extracts job description from a URL
   * @param {string} url - The job posting URL
   * @returns {Promise<Object>} - Job data including description, title, company, and source
   */
  async function extractJobDescriptionFromUrl(url) {
    console.log("Extracting job description from URL:", url)

    if (!url) {
      throw new Error("URL is required")
    }

    try {
      // Validate URL format
      new URL(url)

      // For demo purposes, we'll simulate a successful API call
      // In a real implementation, this would make a server-side request to scrape the job posting
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Determine the source based on the URL
      let source = "Unknown"
      let title = "Software Developer"
      let company = "Tech Company"

      if (url.includes("indeed.com")) {
        source = "Indeed"
        title = "Senior Software Engineer"
        company = "Indeed Tech"
      } else if (url.includes("linkedin.com")) {
        source = "LinkedIn"
        title = "Full Stack Developer"
        company = "LinkedIn Corp"
      } else if (url.includes("glassdoor.com")) {
        source = "Glassdoor"
        title = "Frontend Developer"
        company = "Glassdoor Inc"
      }

      // Return mock job description
      return {
        jobDescription: `${title}
${company}

About the role:
We are seeking an experienced ${title} to join our team. The ideal candidate will have strong programming skills and experience with modern web technologies.

Responsibilities:
• Design, develop, and maintain high-quality software
• Collaborate with cross-functional teams to define and implement new features
• Write clean, maintainable, and efficient code
• Troubleshoot and debug applications
• Participate in code reviews and contribute to team knowledge sharing

Requirements:
• Bachelor's degree in Computer Science or related field
• 3+ years of experience in software development
• Proficiency in JavaScript, TypeScript, and modern frameworks (React, Angular, or Vue)
• Experience with backend technologies such as Node.js, Python, or Java
• Familiarity with database systems (SQL and NoSQL)
• Strong problem-solving skills and attention to detail
• Excellent communication and teamwork abilities

Nice to have:
• Experience with cloud platforms (AWS, Azure, or GCP)
• Knowledge of CI/CD pipelines and DevOps practices
• Contributions to open-source projects
• Experience with microservices architecture

Benefits:
• Competitive salary and benefits package
• Flexible work arrangements
• Professional development opportunities
• Collaborative and innovative work environment`,
        title,
        company,
        source,
      }
    } catch (error) {
      console.error("Error extracting job description:", error)
      throw new Error(`Failed to extract job description: ${error.message}`)
    }
  }

  // Expose function to global scope
  window.extractJobDescriptionFromUrl = extractJobDescriptionFromUrl

  document.addEventListener("DOMContentLoaded", () => {
    // Get DOM elements
    const jobUrlInput = document.getElementById("jobUrl")
    const fetchJobButton = document.getElementById("fetchJobButton")
    const jobDescriptionTextarea = document.getElementById("jobDescription")
    const jobDescriptionLoading = document.getElementById("jobDescriptionLoading")
    const jobUrlStatus = document.getElementById("jobUrlStatus")
    const tabButtons = document.querySelectorAll(".tab-button")
    const tabContents = document.querySelectorAll(".tab-content")
    const keywordsList = document.getElementById("keywordsList")

    // Initialize tab functionality
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        tabButtons.forEach((btn) => btn.classList.remove("active"))
        // Add active class to clicked button
        button.classList.add("active")

        // Hide all tab contents
        tabContents.forEach((content) => content.classList.add("hidden"))
        // Show the selected tab content
        const tabId = button.getAttribute("data-tab")
        document.getElementById(`${tabId}Tab`).classList.remove("hidden")
      })
    })

    // Handle fetch job button click
    if (fetchJobButton) {
      fetchJobButton.addEventListener("click", fetchJobDescription)
    }

    // Handle Enter key press in URL input
    if (jobUrlInput) {
      jobUrlInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          fetchJobDescription()
        }
      })
    }

    // Function to fetch job description from URL
    async function fetchJobDescription() {
      // Get URL from input
      const url = jobUrlInput.value.trim()

      // Validate URL
      if (!url) {
        showStatus("Please enter a job posting URL", "error")
        return
      }

      // Basic URL validation
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        showStatus("Please enter a valid URL starting with http:// or https://", "error")
        return
      }

      // Show loading state
      setLoading(true)
      showStatus("Fetching job description...", "info")

      try {
        // Make API request to backend
        const response = await fetch("/api/extract-job", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        })

        // Parse response
        const data = await response.json()

        // Handle success
        if (data.success && data.jobDescription) {
          // Update job description textarea
          jobDescriptionTextarea.value = data.jobDescription

          // Switch to paste tab to show the result
          document.querySelector('.tab-button[data-tab="paste"]').click()

          // Extract keywords if available
          if (data.skills && data.skills.length > 0) {
            addKeywordsToList(data.skills)
          }

          // Show success message
          showStatus(`Successfully extracted job description from ${data.source || "website"}`, "success")

          // Track event
          const gtag = window.gtag // Declare gtag variable
          if (typeof gtag === "function") {
            gtag("event", "job_description_extracted", {
              event_category: "job_application",
              event_label: data.source || "unknown",
            })
          }
        } else {
          // Handle error
          showStatus(data.error || "Failed to extract job description. Try copying it manually.", "error")
        }
      } catch (error) {
        // Handle fetch error
        showStatus("Error connecting to server. Please try again later.", "error")
        console.error("Error fetching job description:", error)
      } finally {
        // Hide loading state
        setLoading(false)
      }
    }

    // Function to show status message
    function showStatus(message, type = "info") {
      if (!jobUrlStatus) return

      jobUrlStatus.textContent = message
      jobUrlStatus.className = "status-message " + type
    }

    // Function to set loading state
    function setLoading(isLoading) {
      if (fetchJobButton) {
        fetchJobButton.disabled = isLoading
      }
      if (jobUrlInput) {
        jobUrlInput.disabled = isLoading
      }
      if (jobDescriptionLoading) {
        jobDescriptionLoading.classList.toggle("hidden", !isLoading)
      }
    }

    // Function to add keywords to the list
    function addKeywordsToList(skills) {
      if (!keywordsList) return

      // Clear existing keywords if needed
      if (keywordsList.children.length === 0) {
        skills.forEach((skill) => {
          const keywordTag = document.createElement("div")
          keywordTag.className = "keyword-tag"
          keywordTag.innerHTML = `
            ${skill}
            <span class="keyword-remove" data-keyword="${skill}">×</span>
          `
          keywordsList.appendChild(keywordTag)
        })

        // Add event listeners to remove buttons
        document.querySelectorAll(".keyword-remove").forEach((removeBtn) => {
          removeBtn.addEventListener("click", function () {
            const keyword = this.getAttribute("data-keyword")
            this.parentElement.remove()
          })
        })
      }
    }

    // Create a fallback API endpoint if the backend is not available
    if (!window.fetch) {
      window.fetch = function mockFetch(url, options) {
        return new Promise((resolve) => {
          console.log("Mock fetch called:", url, options)

          // Simulate API response
          setTimeout(() => {
            const body = JSON.parse(options.body)
            const jobUrl = body.url

            let response = {
              success: false,
              error: "Could not extract job description",
            }

            // Simple mock response based on URL
            if (jobUrl.includes("linkedin.com")) {
              response = {
                success: true,
                jobDescription:
                  "This is a mock LinkedIn job description for testing purposes.\n\nRequirements:\n- JavaScript\n- React\n- Node.js\n\nResponsibilities:\n- Develop web applications\n- Work with team members\n- Maintain code quality",
                source: "LinkedIn",
                skills: ["JavaScript", "React", "Node.js"],
              }
            } else if (jobUrl.includes("indeed.com")) {
              response = {
                success: true,
                jobDescription:
                  "This is a mock Indeed job description for testing purposes.\n\nQualifications:\n- HTML/CSS\n- Python\n- SQL\n\nJob duties:\n- Create database queries\n- Design user interfaces\n- Analyze data",
                source: "Indeed",
                skills: ["HTML/CSS", "Python", "SQL"],
              }
            }

            resolve({
              ok: true,
              json: () => Promise.resolve(response),
            })
          }, 1500)
        })
      }
    }
  })
})()
