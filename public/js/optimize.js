/**
 * Main JavaScript for the Resume Optimizer tool
 */

document.addEventListener("DOMContentLoaded", () => {
  // Declare gtag if it's not already defined
  if (typeof gtag === "undefined") {
    window.gtag = () => {
      console.warn("gtag function is not defined. Ensure Google Analytics is properly configured.")
    }
  }

  // DOM elements
  const resumeUploadArea = document.getElementById("resumeUploadArea")
  const resumeFile = document.getElementById("resumeFile")
  const resumeFileInfo = document.getElementById("resumeFileInfo")
  const resumeFileName = document.getElementById("resumeFileName")
  const removeResumeFile = document.getElementById("removeResumeFile")
  const jobDescription = document.getElementById("jobDescription")
  const jobUrl = document.getElementById("jobUrl")
  const fetchJobButton = document.getElementById("fetchJobButton")
  const jobDescriptionLoading = document.getElementById("jobDescriptionLoading")
  const jobUrlStatus = document.getElementById("jobUrlStatus")
  const keywordInput = document.getElementById("keywordInput")
  const keywordsList = document.getElementById("keywordsList")
  const analyzeButton = document.getElementById("analyzeButton")
  const initialMessage = document.getElementById("initialMessage")
  const loadingMessage = document.getElementById("loadingMessage")
  const resultsArea = document.getElementById("resultsArea")
  const scoreCircle = document.getElementById("scoreCircle")
  const scoreText = document.getElementById("scoreText")
  const keywordAnalysis = document.getElementById("keywordAnalysis")
  const suggestionsList = document.getElementById("suggestionsList")
  const resumePreview = document.getElementById("resumePreview")
  const downloadPdfButton = document.getElementById("downloadPdfButton")
  const saveAnalysisButton = document.getElementById("saveAnalysisButton")
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")

  // Variables to store data
  const resumeData = {
    file: null,
    text: "",
    fileType: "",
  }
  let additionalKeywords = []
  let analysisResults = null
  let jobMetadata = {
    title: "",
    company: "",
    source: "",
  }

  // Initialize from local storage if available
  initFromLocalStorage()

  // Tab functionality
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab")

      // Update active tab button
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Show selected tab content
      tabContents.forEach((content) => content.classList.add("hidden"))
      document.getElementById(`${tabId}Tab`).classList.remove("hidden")
    })
  })

  // Resume upload functionality
  resumeUploadArea.addEventListener("click", () => {
    resumeFile.click()
  })

  resumeFile.addEventListener("change", handleFileSelection)

  resumeUploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    resumeUploadArea.classList.add("dragover")
  })

  resumeUploadArea.addEventListener("dragleave", () => {
    resumeUploadArea.classList.remove("dragover")
  })

  resumeUploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    resumeUploadArea.classList.remove("dragover")

    if (e.dataTransfer.files.length) {
      handleFileSelection({ target: { files: e.dataTransfer.files } })
    }
  })

  removeResumeFile.addEventListener("click", (e) => {
    e.stopPropagation()
    resetResumeFile()
  })

  // Job URL functionality
  fetchJobButton.addEventListener("click", fetchJobDescription)

  // Keywords functionality
  keywordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && keywordInput.value.trim()) {
      addKeyword(keywordInput.value.trim())
      keywordInput.value = ""
      e.preventDefault()
    }
  })

  // Analyze button functionality
  analyzeButton.addEventListener("click", analyzeResume)

  // Download and save buttons
  downloadPdfButton.addEventListener("click", downloadOptimizedPdf)
  saveAnalysisButton.addEventListener("click", saveAnalysisToLocalStorage)

  /**
   * Handles file selection from the file input
   */
  async function handleFileSelection(event) {
    const file = event.target.files[0]

    if (!file) return

    // Validate file type
    const fileExtension = file.name.split(".").pop().toLowerCase()
    const validExtensions = ["pdf", "doc", "docx"]

    if (!validExtensions.includes(fileExtension)) {
      alert("Please upload a PDF, DOC, or DOCX file")
      return
    }

    try {
      // Show loading indicator for file processing
      initialMessage.classList.add("hidden")
      loadingMessage.classList.remove("hidden")

      resumeData.file = file
      resumeData.fileType = fileExtension
      resumeFileName.textContent = file.name

      // Extract text from file using the appropriate function
      resumeData.text = await window.extractTextFromFile(file)

      // Hide loading indicator
      loadingMessage.classList.add("hidden")
      initialMessage.classList.remove("hidden")

      // Update UI
      resumeUploadArea.classList.add("hidden")
      resumeFileInfo.classList.remove("hidden")

      // Enable analyze button if job description is also filled
      checkAnalyzeButtonState()

      // Track event
      if (typeof gtag === "function") {
        gtag("event", "resume_upload", {
          event_category: "engagement",
          event_label: fileExtension,
        })
      }
    } catch (error) {
      // Hide loading indicator
      loadingMessage.classList.add("hidden")
      initialMessage.classList.remove("hidden")

      alert(error.message)
      resetResumeFile()
    }
  }

  /**
   * Fetches job description from URL
   */
  async function fetchJobDescription() {
    const url = jobUrl.value.trim()

    if (!url) {
      updateJobUrlStatus("Please enter a job posting URL", "error")
      return
    }

    try {
      // Validate URL format
      new URL(url)

      // Clear previous status
      updateJobUrlStatus("", "")

      // Show loading indicator
      jobDescriptionLoading.classList.remove("hidden")
      updateJobUrlStatus("Fetching job description...", "info")

      // Disable fetch button to prevent multiple requests
      fetchJobButton.disabled = true

      // Fetch job description
      const jobData = await window.extractJobDescriptionFromUrl(url)

      // Update job description textarea
      jobDescription.value = jobData.jobDescription

      // Store metadata
      jobMetadata = {
        title: jobData.title,
        company: jobData.company,
        source: jobData.source,
      }

      // Switch to paste tab to show the result
      document.querySelector('.tab-button[data-tab="paste"]').click()

      // Enable analyze button if resume is also uploaded
      checkAnalyzeButtonState()

      // Track event
      if (typeof gtag === "function") {
        gtag("event", "job_url_fetch", {
          event_category: "engagement",
          event_label: jobData.source,
        })
      }

      // Show success message
      updateJobUrlStatus(`Successfully extracted job description for ${jobData.title} at ${jobData.company}`, "success")
    } catch (error) {
      updateJobUrlStatus(error.message, "error")
    } finally {
      // Hide loading indicator and re-enable button
      jobDescriptionLoading.classList.add("hidden")
      fetchJobButton.disabled = false
    }
  }

  /**
   * Updates the job URL status message
   * @param {string} message - The status message
   * @param {string} type - The message type (error, success, info)
   */
  function updateJobUrlStatus(message, type) {
    if (!jobUrlStatus) return

    jobUrlStatus.textContent = message

    // Remove all status classes
    jobUrlStatus.classList.remove("error", "success", "info")

    // Add the appropriate class
    if (type) {
      jobUrlStatus.classList.add(type)
    }
  }

  /**
   * Resets the resume file input
   */
  function resetResumeFile() {
    resumeFile.value = ""
    resumeData.file = null
    resumeData.text = ""
    resumeData.fileType = ""
    resumeUploadArea.classList.remove("hidden")
    resumeFileInfo.classList.add("hidden")
    checkAnalyzeButtonState()
  }

  /**
   * Adds a keyword to the keywords list
   */
  function addKeyword(keyword) {
    if (additionalKeywords.includes(keyword)) return

    additionalKeywords.push(keyword)

    const keywordTag = document.createElement("div")
    keywordTag.className = "keyword-tag"
    keywordTag.innerHTML = `
      ${keyword}
      <span class="keyword-remove" data-keyword="${keyword}">×</span>
    `

    keywordTag.querySelector(".keyword-remove").addEventListener("click", function () {
      const keyword = this.getAttribute("data-keyword")
      removeKeyword(keyword, keywordTag)
    })

    keywordsList.appendChild(keywordTag)
  }

  /**
   * Removes a keyword from the keywords list
   */
  function removeKeyword(keyword, element) {
    additionalKeywords = additionalKeywords.filter((k) => k !== keyword)
    element.remove()
  }

  /**
   * Checks if the analyze button should be enabled
   */
  function checkAnalyzeButtonState() {
    const hasResume = resumeData.file !== null
    const hasJobDescription = jobDescription.value.trim().length > 0

    if (hasResume && hasJobDescription) {
      analyzeButton.disabled = false
      analyzeButton.classList.remove("disabled")
    } else {
      analyzeButton.disabled = true
      analyzeButton.classList.add("disabled")
    }
  }

  /**
   * Analyzes the resume against the job description
   */
  async function analyzeResume() {
    if (!resumeData.file || !jobDescription.value.trim()) {
      alert("Please upload a resume and enter a job description")
      return
    }

    try {
      // Show loading state
      initialMessage.classList.add("hidden")
      loadingMessage.classList.remove("hidden")
      resultsArea.classList.add("hidden")

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Perform analysis
      analysisResults = window.analyzeKeywordMatch(resumeData.text, jobDescription.value, additionalKeywords)

      // Update UI with results
      displayResults(analysisResults)

      // Track event
      if (typeof gtag === "function") {
        gtag("event", "resume_analysis", {
          event_category: "engagement",
          event_label: `score_${analysisResults.score}`,
          file_type: resumeData.fileType,
        })
      }
    } catch (error) {
      alert("An error occurred while analyzing your resume: " + error.message)
      loadingMessage.classList.add("hidden")
      initialMessage.classList.remove("hidden")
    }
  }

  /**
   * Displays the analysis results in the UI
   */
  function displayResults(results) {
    // Hide loading, show results
    loadingMessage.classList.add("hidden")
    resultsArea.classList.remove("hidden")

    // Update score
    scoreCircle.style.strokeDasharray = `${results.score}, 100`
    scoreText.textContent = `${results.score}%`

    // Update keyword analysis
    displayKeywordAnalysis(results)

    // Update suggestions
    displaySuggestions(results.suggestions)

    // Update resume preview
    displayResumePreview(resumeData.text, results)
  }

  /**
   * Displays keyword analysis in the UI
   */
  function displayKeywordAnalysis(results) {
    keywordAnalysis.innerHTML = ""

    // Matching keywords section
    if (results.matchingKeywords.length > 0) {
      const matchingSection = document.createElement("div")
      matchingSection.className = "keyword-category"
      matchingSection.innerHTML = `
        <h4>
          <span class="keyword-category-icon">✓</span>
          Found in Your Resume (${results.matchingKeywords.length})
        </h4>
      `

      results.matchingKeywords.forEach((keyword) => {
        const keywordItem = document.createElement("div")
        keywordItem.className = "keyword-item"
        keywordItem.innerHTML = `
          <div class="keyword-match-icon match">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="keyword-text">${keyword.text}</div>
          <div class="keyword-frequency">${keyword.frequency}×</div>
        `
        matchingSection.appendChild(keywordItem)
      })

      keywordAnalysis.appendChild(matchingSection)
    }

    // Missing keywords section
    if (results.missingKeywords.length > 0) {
      const missingSection = document.createElement("div")
      missingSection.className = "keyword-category"
      missingSection.innerHTML = `
        <h4>
          <span class="keyword-category-icon">✗</span>
          Missing from Your Resume (${results.missingKeywords.length})
        </h4>
      `

      results.missingKeywords.forEach((keyword) => {
        const keywordItem = document.createElement("div")
        keywordItem.className = "keyword-item"
        keywordItem.innerHTML = `
          <div class="keyword-match-icon missing">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <div class="keyword-text">${keyword}</div>
        `
        missingSection.appendChild(keywordItem)
      })

      keywordAnalysis.appendChild(missingSection)
    }
  }

  /**
   * Displays suggestions in the UI
   */
  function displaySuggestions(suggestions) {
    suggestionsList.innerHTML = ""

    suggestions.forEach((suggestion) => {
      const li = document.createElement("li")
      li.textContent = suggestion
      suggestionsList.appendChild(li)
    })
  }

  /**
   * Displays resume preview with highlighted keywords
   */
  function displayResumePreview(text, results) {
    // Get all matching keywords
    const keywords = results.matchingKeywords.map((k) => k.text)

    // Highlight keywords in text
    const highlightedText = window.highlightKeywords(text, keywords)

    // Add some basic styling
    resumePreview.innerHTML = `
      <style>
        .highlight {
          background-color: rgba(74, 108, 247, 0.2);
          padding: 0 2px;
          border-radius: 2px;
        }
      </style>
      ${highlightedText}
    `
  }

  /**
   * Downloads the optimized PDF
   */
  async function downloadOptimizedPdf() {
    if (!analysisResults) return

    try {
      const pdfBlob = await window.createOptimizedPDF(resumeData.text, analysisResults)

      // Create download link
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = "optimized-resume.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Track event
      if (typeof gtag === "function") {
        gtag("event", "download_optimized_pdf", {
          event_category: "engagement",
          file_type: resumeData.fileType,
        })
      }
    } catch (error) {
      alert("Error creating optimized PDF: " + error.message)
    }
  }

  /**
   * Saves analysis to local storage
   */
  function saveAnalysisToLocalStorage() {
    if (!analysisResults) return

    const dataToSave = {
      resumeText: resumeData.text,
      jobDescription: jobDescription.value,
      additionalKeywords,
      analysisResults,
      fileType: resumeData.fileType,
      jobMetadata,
      timestamp: new Date().toISOString(),
    }

    localStorage.setItem("resumeOptimizerData", JSON.stringify(dataToSave))
    alert("Analysis saved! You can come back later to continue working on it.")

    // Track event
    if (typeof gtag === "function") {
      gtag("event", "save_analysis", {
        event_category: "engagement",
        file_type: resumeData.fileType,
      })
    }
  }

  /**
   * Initializes the app from data in local storage
   */
  function initFromLocalStorage() {
    const savedData = localStorage.getItem("resumeOptimizerData")
    if (!savedData) return

    try {
      const data = JSON.parse(savedData)

      // Ask user if they want to load saved data
      if (confirm("We found a previously saved analysis. Would you like to load it?")) {
        // Set job description
        jobDescription.value = data.jobDescription || ""

        // Set additional keywords
        if (data.additionalKeywords && Array.isArray(data.additionalKeywords)) {
          data.additionalKeywords.forEach((keyword) => addKeyword(keyword))
        }

        // Set resume text
        if (data.resumeText) {
          resumeData.text = data.resumeText
          resumeData.fileType = data.fileType || "pdf"
          resumeFileName.textContent = "Saved Resume." + resumeData.fileType
          resumeUploadArea.classList.add("hidden")
          resumeFileInfo.classList.remove("hidden")
        }

        // Set job metadata if available
        if (data.jobMetadata) {
          jobMetadata = data.jobMetadata
        }

        // If we have analysis results, display them
        if (data.analysisResults) {
          analysisResults = data.analysisResults
          checkAnalyzeButtonState()
          initialMessage.classList.add("hidden")
          displayResults(analysisResults)
        }
      }
    } catch (error) {
      console.error("Error loading saved data:", error)
    }
  }

  // Listen for job description changes to enable/disable analyze button
  jobDescription.addEventListener("input", checkAnalyzeButtonState)
})
