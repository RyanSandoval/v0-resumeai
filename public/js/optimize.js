document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const resumeUploadArea = document.getElementById("resumeUploadArea")
  const resumeFileInput = document.getElementById("resumeFile")
  const resumeFileInfo = document.getElementById("resumeFileInfo")
  const resumeFileName = document.getElementById("resumeFileName")
  const removeResumeFile = document.getElementById("removeResumeFile")
  const jobDescription = document.getElementById("jobDescription")
  const keywordInput = document.getElementById("keywordInput")
  const keywordsList = document.getElementById("keywordsList")
  const analyzeButton = document.getElementById("analyzeButton")
  const resultsArea = document.getElementById("resultsArea")
  const initialMessage = document.getElementById("initialMessage")
  const loadingMessage = document.getElementById("loadingMessage")
  const scoreCircle = document.getElementById("scoreCircle")
  const scoreText = document.getElementById("scoreText")
  const resumeEditor = document.getElementById("resumeEditor")
  const resumeComparison = document.getElementById("resumeComparison")
  const editorStatus = document.getElementById("editorStatus")
  const analysisStatus = document.getElementById("analysisStatus")
  const viewModeToggles = document.querySelectorAll(".view-mode-toggle")
  const improvementSuggestions = document.getElementById("improvementSuggestions")
  const emptySuggestions = document.getElementById("emptySuggestions")
  const appliedSuggestionsCount = document.getElementById("appliedSuggestionsCount")
  const matchingKeywords = document.getElementById("matchingKeywords")
  const missingKeywords = document.getElementById("missingKeywords")
  const downloadPdfButton = document.getElementById("downloadPdfButton")
  const saveAnalysisButton = document.getElementById("saveAnalysisButton")
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")
  const jobUrl = document.getElementById("jobUrl")
  const fetchJobButton = document.getElementById("fetchJobButton")
  const jobDescriptionLoading = document.getElementById("jobDescriptionLoading")
  const jobUrlStatus = document.getElementById("jobUrlStatus")

  // State
  let resumeFile = null
  let resumeText = ""
  let originalResumeText = ""
  let optimizedResumeText = ""
  let keywords = []
  let suggestions = []
  const appliedSuggestions = []
  let matchScore = 0
  let isAnalyzing = false

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
    if (viewModeToggles) {
      viewModeToggles.forEach(toggle => {
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
        resumeUploadArea.classList.add("dragover")
      })

      resumeUploadArea.addEventListener("dragleave", () => {
        resumeUploadArea.classList.remove("dragover")
      })

      resumeUploadArea.addEventListener("drop", (e) => {
        e.preventDefault()
        resumeUploadArea.classList.remove("dragover")
        
        if (e.dataTransfer.files.length) {
          resumeFileInput.files = e.dataTransfer.files
          handleResumeFileSelect()
        }
      })
    }
  }

  function initTabs() {
    // Initialize tab functionality
    if (tabButtons && tabContents) {
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
    }
  }

  async function handleResumeFileSelect() {
    if (resumeFileInput.files.length === 0) return

    resumeFile = resumeFileInput.files[0]
    
    // Update UI
    resumeFileName.textContent = resumeFile.name
    resumeUploadArea.classList.add("hidden")
    resumeFileInfo.classList.remove("hidden")

    try {
      // Extract text from resume file
      resumeText = await extractTextFromFile(resumeFile)
      originalResumeText = resumeText

      // Update resume editor if it exists
      if (resumeEditor) {
        resumeEditor.value = resumeText
      }

      // Track event
      if (typeof gtag === "function") {
        gtag("event", "resume_uploaded", {
          event_category: "engagement",
          event_label: resumeFile.type,
        })
      }
    } catch (error) {
      console.error("Error extracting text from file:", error)
      alert("Could not read the resume file. Please try a different file.")
      handleRemoveResumeFile()
    }
  }

  function handleRemoveResumeFile() {
    resumeFile = null
    resumeText = ""
    originalResumeText = ""
    resumeFileInput.value = ""
    resumeUploadArea.classList.remove("hidden")
    resumeFileInfo.classList.add("hidden")
    
    // Reset resume editor if it exists
    if (resumeEditor) {
      resumeEditor.value = ""
    }
  }

  function handleKeywordInputKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      
      const keyword = keywordInput.value.trim()
      if (keyword && !keywords.includes(keyword)) {
        addKeyword(keyword)
        keywordInput.value = ""
      }
    }
  }

  function addKeyword(keyword) {
    keywords.push(keyword)
    
    const keywordTag = document.createElement("div")
    keywordTag.className = "keyword-tag"
    keywordTag.innerHTML = `
      ${keyword}
      <span class="keyword-remove" data-keyword="${keyword}">×</span>
    `
    keywordsList.appendChild(keywordTag)
    
    // Add event listener to remove button
    const removeBtn = keywordTag.querySelector(".keyword-remove")
    removeBtn.addEventListener("click", function() {
      const keywordToRemove = this.getAttribute("data-keyword")
      keywords = keywords.filter(k => k !== keywordToRemove)
      this.parentElement.remove()
    })
  }

  async function handleAnalyzeClick() {
    if (!resumeText) {
      alert("Please upload a resume first.")
      return
    }
    
    if (!jobDescription.value.trim()) {
      alert("Please enter a job description.")
      return
    }
    
    // Show loading state
    initialMessage.classList.add("hidden")
    resultsArea.classList.add("hidden")
    loadingMessage.classList.remove("hidden")
    isAnalyzing = true
    
    try {
      // Analyze resume
      const result = await analyzeResume(resumeText, jobDescription.value, keywords)
      
      // Update state
      matchScore = result.score
      suggestions = result.suggestions
      optimizedResumeText = result.optimizedResume
      
      // Update UI
      updateScoreDisplay(matchScore)
      updateSuggestions(suggestions)
      updateKeywords(result.matchingKeywords, result.missingKeywords)
      
      // Update resume editor
      resumeEditor.value = resumeText
      
      // Show results
      loadingMessage.classList.add("hidden")
      resultsArea.classList.remove("hidden")
      
      // Track event
      if (typeof gtag === "function") {
        gtag("event", "resume_analyzed", {
          event_category: "engagement",
          event_label: "score_" + Math.round(matchScore / 10) * 10,
          value: Math.round(matchScore)
        })
      }
    } catch (error) {
      console.error("Error analyzing resume:", error)
      alert("An error occurred while analyzing your resume. Please try again.")
      loadingMessage.classList.add("hidden")
      initialMessage.classList.remove("hidden")
    } finally {
      isAnalyzing = false
    }
  }

  function handleViewModeToggle() {
    // Remove active class from all toggles
    viewModeToggles.forEach(toggle => toggle.classList.remove("active"))
    
    // Add active class to clicked toggle
    this.classList.add("active")
    
    // Get view mode
    const viewMode = this.getAttribute("data-mode")
    
    // Update UI based on view mode
    switch (viewMode) {
      case "edit":
        resumeEditor.classList.remove("hidden")
        resumeComparison.classList.add("hidden")
        resumeEditor.value = resumeText
        break
      case "original":
        resumeEditor.classList.remove("hidden")
        resumeComparison.classList.add("hidden")
        resumeEditor.value = originalResumeText
        resumeEditor.setAttribute("readonly", "readonly")
        break
      case "optimized":
        resumeEditor.classList.remove("hidden")
        resumeComparison.classList.add("hidden")
        resumeEditor.value = optimizedResumeText
        resumeEditor.setAttribute("readonly", "readonly")
        break
      case "comparison":
        resumeEditor.classList.add("hidden")
        resumeComparison.classList.remove("hidden")
        showComparison()
        break
    }
    
    // Remove readonly attribute when switching away from original/optimized
    if (viewMode !== "original" && viewMode !== "optimized") {
      resumeEditor.removeAttribute("readonly")
    }
  }

  function handleResumeEditorInput() {
    // Update resume text
    resumeText = resumeEditor.value
    
    // Update status
    editorStatus.textContent = "Editing..."
    
    // Debounce analysis update
    clearTimeout(window.editorTimeout)
    window.editorTimeout = setTimeout(() => {
      updateAnalysis()
      editorStatus.textContent = "Changes saved"
    }, 1000)
  }

  async function updateAnalysis() {
    if (isAnalyzing) return
    
    analysisStatus.textContent = "Updating analysis..."
    
    try {
      // Re-analyze resume
      const result = await analyzeResume(resumeText, jobDescription.value, keywords)
      
      // Update state
      matchScore = result.score
      suggestions = result.suggestions.filter(s => !appliedSuggestions.includes(s.id))
      
      // Update UI
      updateScoreDisplay(matchScore)
      updateSuggestions(suggestions)
      updateKeywords(result.matchingKeywords, result.missingKeywords)
      
      analysisStatus.textContent = "Analysis updated"
      
      // Clear status after a delay
      setTimeout(() => {
        analysisStatus.textContent = ""
      }, 3000)
    } catch (error) {
      console.error("Error updating analysis:", error)
      analysisStatus.textContent = "Error updating analysis"
    }
  }

  function updateScoreDisplay(score) {
    // Update score circle
    const dashArray = `${score}, 100`
    scoreCircle.setAttribute("stroke-dasharray", dashArray)
    
    // Update score text
    scoreText.textContent = `${Math.round(score)}%`
    
    // Update score color based on value
    let color = "#4A6CF7" // Default blue
    if (score < 40) {
      color = "#EF4444" // Red for low scores
    } else if (score < 70) {
      color = "#F59E0B" // Amber for medium scores
    } else if (score >= 90) {
      color = "#10B981" // Green for high scores
    }
    
    scoreCircle.setAttribute("stroke", color)
    score
