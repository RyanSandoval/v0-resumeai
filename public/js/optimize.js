/**
 * Main JavaScript for the Resume Optimizer tool
 */

document.addEventListener("DOMContentLoaded", () => {
  // Declare gtag if it's not already defined
  const gtag =
    window.gtag ||
    (() => {
      console.log("Google Analytics not loaded, tracking disabled")
    })

  // DOM elements
  const resumeUploadArea = document.getElementById("resumeUploadArea")
  const resumeFileInput = document.getElementById("resumeFile")
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
  const uploadErrorMessage = document.getElementById("uploadErrorMessage")
  const uploadErrorText = document.getElementById("uploadErrorText")

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
  let isDragging = false

  // State
  const resumeFile = null
  const resumeText = ""
  const originalResumeText = ""
  const optimizedResumeText = ""
  const keywords = []
  const suggestions = []
  const appliedSuggestions = []
  const matchScore = 0
  const isAnalyzing = false

  // Initialize from local storage if available
  initFromLocalStorage()

  // Initialize
  init()

  function init() {
    // Set up event listeners
    setupEventListeners()

    // Initialize tabs
    initTabs()
  }

  function setupEventListeners() {
    // Resume upload area click
    if (resumeUploadArea) {
      resumeUploadArea.addEventListener("click", () => {
        resumeFileInput.click()
      })
    }

    // Resume file input change
    if (resumeFileInput) {
      resumeFileInput.addEventListener("change", handleResumeFileSelect)
    }

    // Remove resume file button
    if (removeResumeFile) {
      removeResumeFile.addEventListener("click", handleRemoveResumeFile)
    }

    // Keyword input
    if (keywordInput) {
      keywordInput.addEventListener("keydown", handleKeywordInputKeydown)
    }

    // Analyze button
    if (analyzeButton) {
      analyzeButton.addEventListener("click", handleAnalyzeClick)
    }

    // View mode toggles
    const viewModeToggles = document.querySelectorAll(".view-mode-toggle")
    if (viewModeToggles) {
      viewModeToggles.forEach((toggle) => {
        toggle.addEventListener("click", handleViewModeToggle)
      })
    }

    // Download PDF button
    if (downloadPdfButton) {
      downloadPdfButton.addEventListener("click", handleDownloadPdf)
    }

    // Save analysis button
    if (saveAnalysisButton) {
      saveAnalysisButton.addEventListener("click", handleSaveAnalysis)
    }

    // Resume editor input
    const resumeEditor = document.getElementById("resumeEditor")
    if (resumeEditor) {
      resumeEditor.addEventListener("input", handleResumeEditorInput)
    }

    // Fetch job button
    if (fetchJobButton) {
      fetchJobButton.addEventListener("click", handleFetchJobClick)
    }

    // Job URL input
    if (jobUrl) {
      jobUrl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          handleFetchJobClick()
        }
      })
    }

    // Drag and drop for resume upload
    if (resumeUploadArea) {
      resumeUploadArea.addEventListener("dragover", (e) => {
        e.preventDefault()
        if (!isDragging) {
          isDragging = true
          resumeUploadArea.classList.add("dragover")
        }
      })

      resumeUploadArea.addEventListener("dragleave", (e) => {
        e.preventDefault()
        // Only trigger if we're leaving the upload area (not entering a child element)
        const rect = resumeUploadArea.getBoundingClientRect()
        if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
          isDragging = false
          resumeUploadArea.classList.remove("dragover")
        }
      })

      resumeUploadArea.addEventListener("drop", (e) => {
        e.preventDefault()
        isDragging = false
        resumeUploadArea.classList.remove("dragover")

        if (e.dataTransfer.files.length) {
          handleResumeFileSelect({ target: { files: e.dataTransfer.files } })
        }
      })
    }
  }

  function initTabs() {
    // Initialize tab functionality
    if (tabButtons && tabContents) {
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
    }
  }

  async function handleResumeFileSelect(event) {
    const file = event.target.files[0]

    if (!file) return

    // Validate file type
    const fileExtension = file.name.split(".").pop().toLowerCase()
    const validExtensions = ["pdf", "doc", "docx", "txt", "rtf"]

    if (!validExtensions.includes(fileExtension)) {
      showUploadError(`Invalid file type: ${fileExtension}. Please upload a PDF, DOC, DOCX, TXT, or RTF file.`)
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      showUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`)
      return
    }

    try {
      // Show loading indicator for file processing
      if (initialMessage) initialMessage.classList.add("hidden")
      if (loadingMessage) loadingMessage.classList.remove("hidden")

      resumeData.file = file
      resumeData.fileType = fileExtension

      if (resumeFileName) {
        resumeFileName.textContent = file.name
      }

      // Extract text from file using the appropriate function
      console.log(`Processing ${fileExtension} file: ${file.name}`)

      try {
        // Check if we have the necessary extraction functions
        if (fileExtension === "pdf" && typeof window.extractTextFromPDF === "function") {
          resumeData.text = await window.extractTextFromPDF(file)
        } else if (
          (fileExtension === "doc" || fileExtension === "docx") &&
          typeof window.extractTextFromDOCX === "function"
        ) {
          resumeData.text = await window.extractTextFromDOCX(file)
        } else if (fileExtension === "txt" || fileExtension === "rtf") {
          // For text files, use the FileReader API
          resumeData.text = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = (e) => reject(new Error("Failed to read text file"))
            reader.readAsText(file)
          })
        } else {
          throw new Error(`No handler available for ${fileExtension} files`)
        }
      } catch (extractionError) {
        console.error("Extraction error:", extractionError)

        // Fallback to FileReader for all file types if specific extraction fails
        try {
          console.log("Attempting fallback extraction with FileReader")
          resumeData.text = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = (e) => reject(new Error("Failed to read file"))
            reader.readAsText(file)
          })
        } catch (fallbackError) {
          throw new Error(`Failed to extract text: ${extractionError.message}`)
        }
      }

      // Validate extracted text
      if (!resumeData.text || resumeData.text.length < 50) {
        throw new Error("Could not extract sufficient text from the file. Please try another file or format.")
      }

      // Hide loading indicator
      if (loadingMessage) loadingMessage.classList.add("hidden")
      if (initialMessage) initialMessage.classList.remove("hidden")

      // Update UI
      if (resumeUploadArea) resumeUploadArea.classList.add("hidden")
      if (resumeFileInfo) resumeFileInfo.classList.remove("hidden")

      // Enable analyze button if job description is also filled
      checkAnalyzeButtonState()

      // Track event
      gtag("event", "resume_upload", {
        event_category: "engagement",
        event_label: fileExtension,
      })

      console.log("File processed successfully")
    } catch (error) {
      console.error("File processing error:", error)

      // Hide loading indicator
      if (loadingMessage) loadingMessage.classList.add("hidden")
      if (initialMessage) initialMessage.classList.remove("hidden")

      showUploadError(error.message || "Error processing file. Please try another file.")
      resetResumeFile()
    }
  }

  function handleRemoveResumeFile() {
    resetResumeFile()
  }

  function handleKeywordInputKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault()

      const keyword = keywordInput.value.trim()
      if (keyword && !additionalKeywords.includes(keyword)) {
        addKeyword(keyword)
        keywordInput.value = ""
      }
    }
  }

  function addKeyword(keyword) {
    if (additionalKeywords.includes(keyword)) return

    additionalKeywords.push(keyword)

    if (!keywordsList) return

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

  function removeKeyword(keyword, element) {
    additionalKeywords = additionalKeywords.filter((k) => k !== keyword)
    element.remove()
  }

  async function handleAnalyzeClick() {
    if ((!resumeData.file && !resumeData.text) || !jobDescription || !jobDescription.value.trim()) {
      alert("Please upload a resume and enter a job description")
      return
    }

    try {
      // Show loading state
      if (initialMessage) initialMessage.classList.add("hidden")
      if (loadingMessage) loadingMessage.classList.remove("hidden")
      if (resultsArea) resultsArea.classList.add("hidden")

      // Perform analysis
      if (typeof window.analyzeKeywordMatch !== "function") {
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
      if (loadingMessage) loadingMessage.classList.add("hidden")
      if (analysisResults && resultsArea) {
        resultsArea.classList.remove("hidden")
      } else if (initialMessage) {
        initialMessage.classList.remove("hidden")
      }
    }
  }

  function handleViewModeToggle() {
    // Remove active class from all toggles
    const viewModeToggles = document.querySelectorAll(".view-mode-toggle")
    viewModeToggles.forEach((toggle) => toggle.classList.remove("active"))

    // Add active class to clicked toggle
    this.classList.add("active")

    // Get view mode
    const viewMode = this.getAttribute("data-mode")

    // Update UI based on view mode
    const resumeEditor = document.getElementById("resumeEditor")
    const resumeComparison = document.getElementById("resumeComparison")
    switch (viewMode) {
      case "edit":
        if (resumeEditor) resumeEditor.classList.remove("hidden")
        if (resumeComparison) resumeComparison.classList.add("hidden")
        if (resumeEditor) resumeEditor.value = resumeData.text
        if (resumeEditor) resumeEditor.removeAttribute("readonly")
        break
      case "original":
        if (resumeEditor) resumeEditor.classList.remove("hidden")
        if (resumeComparison) resumeComparison.classList.add("hidden")
        if (resumeEditor) resumeEditor.value = resumeData.text
        if (resumeEditor) resumeEditor.setAttribute("readonly", "readonly")
        break
      case "optimized":
        if (resumeEditor) resumeEditor.classList.remove("hidden")
        if (resumeComparison) resumeComparison.classList.add("hidden")
        if (resumeEditor) resumeEditor.value = resumeData.text
        if (resumeEditor) resumeEditor.setAttribute("readonly", "readonly")
        break
      case "comparison":
        if (resumeEditor) resumeEditor.classList.add("hidden")
        if (resumeComparison) resumeComparison.classList.remove("hidden")
        showComparison()
        break
    }

    // Remove readonly attribute when switching away from original/optimized
    if (viewMode !== "original" && viewMode !== "optimized") {
      if (resumeEditor) resumeEditor.removeAttribute("readonly")
    }
  }

  function handleResumeEditorInput() {
    // Update resume text
    const resumeEditor = document.getElementById("resumeEditor")
    if (resumeEditor) resumeData.text = resumeEditor.value

    // Update status
    const editorStatus = document.getElementById("editorStatus")
    if (editorStatus) editorStatus.textContent = "Editing..."

    // Debounce analysis update
    clearTimeout(window.editorTimeout)
    window.editorTimeout = setTimeout(() => {
      updateAnalysis()
      if (editorStatus) editorStatus.textContent = "Changes saved"
    }, 1000)
  }

  async function updateAnalysis() {
    if (isAnalyzing) return

    const analysisStatus = document.getElementById("analysisStatus")
    if (analysisStatus) analysisStatus.textContent = "Updating analysis..."

    try {
      // Re-analyze resume
      if (typeof window.analyzeKeywordMatch !== "function") {
        throw new Error("Analysis function not loaded. Please refresh the page and try again.")
      }

      analysisResults = window.analyzeKeywordMatch(resumeData.text, jobDescription.value, additionalKeywords)

      // Update UI with results
      displayResults(analysisResults)

      analysisStatus.textContent = "Analysis updated"

      // Clear status after a delay
      setTimeout(() => {
        if (analysisStatus) analysisStatus.textContent = ""
      }, 3000)
    } catch (error) {
      console.error("Error updating analysis:", error)
      if (analysisStatus) analysisStatus.textContent = "Error updating analysis"
    }
  }

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

  function handleDownloadPdf() {
    downloadOptimizedPdf()
  }

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

      if (typeof window.createOptimizedPDF !== "function") {
        throw new Error("PDF creation function not loaded")
      }

      const pdfBlob = await window.createOptimizedPDF(currentText, analysisResults)

      // Create download link
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = "optimized-resume.pdf"
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

  function handleSaveAnalysis() {
    saveAnalysisToLocalStorage()
  }

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
        jobDescription: jobDescription ? jobDescription.value : "",
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

  function initFromLocalStorage() {
    try {
      const savedData = localStorage.getItem("resumeOptimizerData")
      if (!savedData) return

      const data = JSON.parse(savedData)

      // Ask user if they want to load saved data
      if (confirm("We found a previously saved analysis. Would you like to load it?")) {
        // Set job description
        if (data.jobDescription && jobDescription) {
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

          if (resumeFileName) {
            resumeFileName.textContent = "Saved Resume." + resumeData.fileType
          }

          if (resumeUploadArea) resumeUploadArea.classList.add("hidden")
          if (resumeFileInfo) resumeFileInfo.classList.remove("hidden")
        }

        // Set job metadata if available
        if (data.jobMetadata) {
          jobMetadata = data.jobMetadata
        }

        // If we have analysis results, display them
        if (data.analysisResults) {
          analysisResults = data.analysisResults
          checkAnalyzeButtonState()

          if (initialMessage) initialMessage.classList.add("hidden")
          if (resultsArea) resultsArea.classList.remove("hidden")

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

  function handleFetchJobClick() {
    fetchJobDescription()
  }

  async function fetchJobDescription() {
    const url = jobUrl ? jobUrl.value.trim() : ""

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
      if (jobDescriptionLoading) jobDescriptionLoading.classList.remove("hidden")
      updateJobUrlStatus("Fetching job description...", "info")

      // Disable fetch button to prevent multiple requests
      if (fetchJobButton) fetchJobButton.disabled = true

      // Check if we have the extraction function
      if (typeof window.extractJobDescriptionFromUrl !== "function") {
        throw new Error("Job description extraction function not available")
      }

      // Fetch job description
      const jobData = await window.extractJobDescriptionFromUrl(url)

      // Update job description textarea
      if (jobDescription) jobDescription.value = jobData.jobDescription

      // Store metadata
      jobMetadata = {
        title: jobData.title || "",
        company: jobData.company || "",
        source: jobData.source || "",
      }

      // Switch to paste tab to show the result
      const pasteTabButton = document.querySelector('.tab-button[data-tab="paste"]')
      if (pasteTabButton) pasteTabButton.click()

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
      if (jobDescriptionLoading) jobDescriptionLoading.classList.add("hidden")
      if (fetchJobButton) fetchJobButton.disabled = false
    }
  }

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

  function checkAnalyzeButtonState() {
    if (!analyzeButton) return

    const hasResume = resumeData.file !== null || resumeData.text.length > 0
    const hasJobDescription = jobDescription && jobDescription.value.trim().length > 0

    if (hasResume && hasJobDescription) {
      analyzeButton.disabled = false
      analyzeButton.classList.remove("disabled")
    } else {
      analyzeButton.disabled = true
      analyzeButton.classList.add("disabled")
    }
  }

  function resetResumeFile() {
    if (resumeFileInput) resumeFileInput.value = ""
    resumeData.file = null
    resumeData.text = ""
    resumeData.fileType = ""
    if (resumeUploadArea) resumeUploadArea.classList.remove("hidden")
    if (resumeFileInfo) resumeFileInfo.classList.add("hidden")
    checkAnalyzeButtonState()
  }

  function showUploadError(message) {
    if (uploadErrorMessage && uploadErrorText) {
      uploadErrorText.textContent = message
      uploadErrorMessage.classList.remove("hidden")

      // Hide after 5 seconds
      setTimeout(() => {
        uploadErrorMessage.classList.add("hidden")
      }, 5000)
    } else {
      // Fallback to alert if error elements not found
      alert("Upload Error: " + message)
    }
  }

  function showComparison() {
    // Implement comparison logic here
    console.log("Comparison logic not implemented yet")
  }

  // Debug helper - expose key functions to window for troubleshooting
  window.resumeOptimizerDebug = {
    analyzeKeywordMatch: window.analyzeKeywordMatch,
    displayResults,
    resumeData,
    getEditorInitialized: () => editorInitialized,
    getAnalysisResults: () => analysisResults,
    checkDomElements: () => {
      return {
        resumeUploadArea: !!resumeUploadArea,
        resumeFileInput: !!resumeFileInput,
        resumeFileInfo: !!resumeFileInfo,
        resumeFileName: !!resumeFileName,
        removeResumeFile: !!removeResumeFile,
        jobDescription: !!jobDescription,
        analyzeButton: !!analyzeButton,
        initialMessage: !!initialMessage,
        loadingMessage: !!loadingMessage,
        resultsArea: !!resultsArea,
      }
    },
  }
})
