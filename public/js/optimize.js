/**
 * Main JavaScript for the Resume Optimizer tool
 */

document.addEventListener("DOMContentLoaded", () => {
  // Declare gtag if it's not already defined
  if (typeof gtag === "undefined") {
    window.gtag = () => {
      console.log("Google Analytics not loaded, tracking disabled")
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
  let editorInitialized = false

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
      if (fileExtension === "pdf") {
        resumeData.text = await window.extractTextFromPDF(file)
      } else if (fileExtension === "doc" || fileExtension === "docx") {
        resumeData.text = await window.extractTextFromDOCX(file)
      }

      // Hide loading indicator
      loadingMessage.classList.add("hidden")
      initialMessage.classList.remove("hidden")

      // Update UI
      resumeUploadArea.classList.add("hidden")
      resumeFileInfo.classList.remove("hidden")

      // Enable analyze button if job description is also filled
      checkAnalyzeButtonState()

      // Track event
      gtag("event", "resume_upload", {
        event_category: "engagement",
        event_label: fileExtension,
      })
    } catch (error) {
      console.error("File processing error:", error)
      // Hide loading indicator
      loadingMessage.classList.add("hidden")
      initialMessage.classList.remove("hidden")

      alert(error.message || "Error processing file. Please try another file.")
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
        title: jobData.title || "",
        company: jobData.company || "",
        source: jobData.source || "",
      }

      // Switch to paste tab to show the result
      document.querySelector('.tab-button[data-tab="paste"]').click()

      // Enable analyze button if resume is also uploaded
      checkAnalyzeButtonState()

      // Track event
      gtag("event", "job_url_fetch", {
        event_category: "engagement",
        event_label: jobData.source,
      })

      // Show success message
      updateJobUrlStatus(`Successfully extracted job description for ${jobData.title} at ${jobData.company}`, "success")
    } catch (error) {
      console.error("Job fetch error:", error)
      updateJobUrlStatus(error.message || "Failed to fetch job description", "error")
    } finally {
      // Hide loading indicator and re-enable button
      jobDescriptionLoading.classList.add("hidden")
      fetchJobButton.disabled = false
    }
  }

  /**
   * Updates the job URL status message
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
    const hasResume = resumeData.file !== null || resumeData.text.length > 0
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
    if ((!resumeData.file && !resumeData.text) || !jobDescription.value.trim()) {
      alert("Please upload a resume and enter a job description")
      return
    }

    try {
      // Show loading state
      initialMessage.classList.add("hidden")
      loadingMessage.classList.remove("hidden")
      resultsArea.classList.add("hidden")

      // Perform analysis
      if (!window.analyzeKeywordMatch) {
        throw new Error("Analysis function not loaded. Please refresh the page and try again.")
      }

      analysisResults = window.analyzeKeywordMatch(resumeData.text, jobDescription.value, additionalKeywords)

      // Update UI with results
      displayResults(analysisResults)

      // Initialize the resume editor if not already initialized
      if (!editorInitialized && window.ResumeEditor) {
        console.log("Initializing resume editor with:", resumeData.text.substring(0, 100) + "...")
        window.ResumeEditor.init(resumeData.text, analysisResults)
        editorInitialized = true
      } else if (!window.ResumeEditor) {
        console.error("Resume Editor not loaded!")
      }

      // Track event
      gtag("event", "resume_analysis", {
        event_category: "engagement",
        event_label: `score_${analysisResults.score}`,
        file_type: resumeData.fileType,
      })
    } catch (error) {
      console.error("Analysis error:", error)
      alert("An error occurred while analyzing your resume: " + (error.message || "Unknown error"))
    } finally {
      // Hide loading indicator
      loadingMessage.classList.add("hidden")
      if (analysisResults) {
        resultsArea.classList.remove("hidden")
      } else {
        initialMessage.classList.remove("hidden")
      }
    }
  }

  /**
   * Displays the analysis results in the UI
   */
  function displayResults(results) {
    if (!results) return

    // Update score
    if (scoreCircle && scoreText) {
      scoreCircle.style.strokeDasharray = `${results.score}, 100`
      scoreText.textContent = `${results.score}%`
    }

    // Update matching keywords in the dedicated lists
    updateKeywordLists(results)
  }

  /**
   * Updates the keyword lists with matching and missing keywords
   */
  function updateKeywordLists(results) {
    const matchingContainer = document.getElementById("matchingKeywords")
    const missingContainer = document.getElementById("missingKeywords")

    if (!matchingContainer || !missingContainer) return

    // Clear existing content
    matchingContainer.innerHTML = ""
    missingContainer.innerHTML = ""

    // Add matching keywords
    if (results.matchingKeywords && results.matchingKeywords.length > 0) {
      results.matchingKeywords.forEach((keyword) => {
        const keywordElement = document.createElement("div")
        keywordElement.className = "keyword-match"
        keywordElement.innerHTML = `
          <span class="keyword-text">${keyword.text}</span>
          <span class="keyword-frequency">${keyword.frequency}×</span>
        `
        matchingContainer.appendChild(keywordElement)
      })
    } else {
      matchingContainer.innerHTML = "<p class='empty-list'>No matching keywords found</p>"
    }

    // Add missing keywords
    if (results.missingKeywords && results.missingKeywords.length > 0) {
      results.missingKeywords.forEach((keyword) => {
        const keywordElement = document.createElement("div")
        keywordElement.className = "keyword-miss"
        keywordElement.innerHTML = `
          <span class="keyword-text">${keyword}</span>
          <button class="keyword-add" data-keyword="${keyword}">Add</button>
        `

        // Add event listener to add button
        keywordElement.querySelector(".keyword-add").addEventListener("click", () => {
          if (window.ResumeEditor) {
            // Use the editor's function to add the keyword
            const editorState = window.ResumeEditor.getState()
            if (editorState && typeof editorState.addKeywordToResume === "function") {
              editorState.addKeywordToResume(keyword)
            } else {
              // Fallback - add to editor directly
              const editor = document.getElementById("resumeEditor")
              if (editor) {
                editor.value = editor.value + "\n• " + keyword
                // Trigger analysis
                window.ResumeEditor.analyze()
              }
            }
          }
        })

        missingContainer.appendChild(keywordElement)
      })
    } else {
      missingContainer.innerHTML = "<p class='empty-list'>No missing keywords found</p>"
    }
  }

  /**
   * Downloads the optimized PDF
   */
  async function downloadOptimizedPdf() {
    if (!analysisResults) return

    try {
      // Get the current text from the editor if it's initialized
      let currentText = resumeData.text

      if (editorInitialized && window.ResumeEditor) {
        const editorState = window.ResumeEditor.getState()
        if (editorState && editorState.currentText) {
          currentText = editorState.currentText
        }
      }

      if (!window.createOptimizedPDF) {
        throw new Error("PDF creation function not loaded")
      }

      const pdfBlob = await window.createOptimizedPDF(currentText, analysisResults)

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
      gtag("event", "download_optimized_pdf", {
        event_category: "engagement",
        file_type: resumeData.fileType,
      })
    } catch (error) {
      console.error("PDF creation error:", error)
      alert("Error creating optimized PDF: " + (error.message || "Unknown error"))
    }
  }

  /**
   * Saves analysis to local storage
   */
  function saveAnalysisToLocalStorage() {
    if (!analysisResults) return

    try {
      // Get the current text from the editor if it's initialized
      let currentText = resumeData.text
      let appliedSuggestions = []

      if (editorInitialized && window.ResumeEditor) {
        const editorState = window.ResumeEditor.getState()
        if (editorState) {
          if (editorState.currentText) {
            currentText = editorState.currentText
          }
          if (editorState.appliedSuggestions) {
            appliedSuggestions = editorState.appliedSuggestions
          }
        }
      }

      const dataToSave = {
        resumeText: resumeData.text,
        optimizedText: currentText,
        jobDescription: jobDescription.value,
        additionalKeywords,
        analysisResults,
        fileType: resumeData.fileType,
        jobMetadata,
        appliedSuggestions,
        timestamp: new Date().toISOString(),
      }

      localStorage.setItem("resumeOptimizerData", JSON.stringify(dataToSave))
      alert("Analysis saved! You can come back later to continue working on it.")

      // Track event
      gtag("event", "save_analysis", {
        event_category: "engagement",
        file_type: resumeData.fileType,
      })
    } catch (error) {
      console.error("Save error:", error)
      alert("Error saving analysis: " + (error.message || "Unknown error"))
    }
  }

  /**
   * Initializes the app from data in local storage
   */
  function initFromLocalStorage() {
    try {
      const savedData = localStorage.getItem("resumeOptimizerData")
      if (!savedData) return

      const data = JSON.parse(savedData)

      // Ask user if they want to load saved data
      if (confirm("We found a previously saved analysis. Would you like to load it?")) {
        // Set job description
        if (data.jobDescription) {
          jobDescription.value = data.jobDescription
        }

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
          resultsArea.classList.remove("hidden")
          displayResults(analysisResults)

          // Initialize the resume editor with saved data
          if (data.optimizedText && window.ResumeEditor) {
            setTimeout(() => {
              window.ResumeEditor.init(data.optimizedText, analysisResults)
              editorInitialized = true
            }, 500) // Short delay to ensure DOM is ready
          }
        }
      }
    } catch (error) {
      console.error("Error loading saved data:", error)
    }
  }

  // Listen for job description changes to enable/disable analyze button
  jobDescription.addEventListener("input", checkAnalyzeButtonState)

  // Debug helper - expose key functions to window for troubleshooting
  window.resumeOptimizerDebug = {
    analyzeResume,
    displayResults,
    resumeData,
    getEditorInitialized: () => editorInitialized,
    getAnalysisResults: () => analysisResults,
  }
})
