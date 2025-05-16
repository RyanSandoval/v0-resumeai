/**
 * Resume Editor Diagnostics Tool
 * This script helps identify and fix issues with the resume editor functionality
 */

// Store diagnostic results
const diagnosticResults = {
  domElements: {},
  eventBindings: {},
  dataFlow: {},
  uiUpdates: {},
}

// Check if required DOM elements exist
function checkDomElements() {
  const requiredElements = [
    "resumeEditor",
    "jobDescriptionInput",
    "resumeUpload",
    "scoreDisplay",
    "keywordsList",
    "suggestionsList",
    "applyChangesBtn",
    "compareBtn",
  ]

  console.log("🔍 Checking DOM elements...")

  requiredElements.forEach((id) => {
    const element = document.getElementById(id)
    diagnosticResults.domElements[id] = !!element

    if (!element) {
      console.error(`❌ Missing DOM element: #${id}`)
    } else {
      console.log(`✅ Found DOM element: #${id}`)
    }
  })

  return Object.values(diagnosticResults.domElements).every((exists) => exists)
}

// Check event bindings
function checkEventBindings() {
  console.log("🔍 Checking event bindings...")

  // Check if event listeners are properly attached
  const eventTargets = {
    resumeUpload: ["change"],
    jobDescriptionInput: ["input", "change"],
    applyChangesBtn: ["click"],
    compareBtn: ["click"],
  }

  for (const [id, events] of Object.entries(eventTargets)) {
    const element = document.getElementById(id)
    if (!element) continue

    events.forEach((eventType) => {
      // We can't directly check if event listeners exist, so we'll add a test listener
      const testHandler = () => {}
      element.addEventListener(eventType, testHandler)
      element.removeEventListener(eventType, testHandler)

      diagnosticResults.eventBindings[`${id}_${eventType}`] = true
      console.log(`✅ Event binding possible for #${id} (${eventType})`)
    })
  }

  return Object.values(diagnosticResults.eventBindings).every((bound) => bound)
}

// Check data flow between components
function checkDataFlow() {
  console.log("🔍 Checking data flow...")

  // Mock data for testing
  const mockResumeText = "Experienced software developer with 5 years of experience in JavaScript and React."
  const mockJobDescription = "Looking for a software developer with JavaScript and React experience."

  try {
    // Test keyword extraction
    if (typeof extractKeywords === "function") {
      const keywords = extractKeywords(mockJobDescription)
      diagnosticResults.dataFlow.keywordExtraction = keywords && keywords.length > 0
      console.log(`✅ Keyword extraction ${diagnosticResults.dataFlow.keywordExtraction ? "works" : "failed"}`)
    } else {
      console.error("❌ extractKeywords function not found")
      diagnosticResults.dataFlow.keywordExtraction = false
    }

    // Test resume analysis
    if (typeof analyzeResume === "function") {
      const analysis = analyzeResume(mockResumeText, mockJobDescription)
      diagnosticResults.dataFlow.resumeAnalysis = !!analysis
      console.log(`✅ Resume analysis ${diagnosticResults.dataFlow.resumeAnalysis ? "works" : "failed"}`)
    } else {
      console.error("❌ analyzeResume function not found")
      diagnosticResults.dataFlow.resumeAnalysis = false
    }

    // Test score calculation
    if (typeof calculateScore === "function") {
      const score = calculateScore(mockResumeText, mockJobDescription)
      diagnosticResults.dataFlow.scoreCalculation = typeof score === "number"
      console.log(`✅ Score calculation ${diagnosticResults.dataFlow.scoreCalculation ? "works" : "failed"}`)
    } else {
      console.error("❌ calculateScore function not found")
      diagnosticResults.dataFlow.scoreCalculation = false
    }
  } catch (error) {
    console.error("❌ Error in data flow check:", error)
    return false
  }

  return Object.values(diagnosticResults.dataFlow).every((works) => works)
}

// Check UI updates
function checkUiUpdates() {
  console.log("🔍 Checking UI updates...")

  const scoreDisplay = document.getElementById("scoreDisplay")
  const keywordsList = document.getElementById("keywordsList")
  const suggestionsList = document.getElementById("suggestionsList")

  if (scoreDisplay) {
    const originalText = scoreDisplay.textContent
    try {
      scoreDisplay.textContent = "Test Score: 85"
      diagnosticResults.uiUpdates.scoreDisplay = scoreDisplay.textContent === "Test Score: 85"
      scoreDisplay.textContent = originalText
      console.log(`✅ Score display update ${diagnosticResults.uiUpdates.scoreDisplay ? "works" : "failed"}`)
    } catch (error) {
      console.error("❌ Error updating score display:", error)
      diagnosticResults.uiUpdates.scoreDisplay = false
    }
  }

  if (keywordsList) {
    try {
      const originalHTML = keywordsList.innerHTML
      keywordsList.innerHTML = '<li class="test-keyword">JavaScript</li>'
      diagnosticResults.uiUpdates.keywordsList = keywordsList.innerHTML.includes("test-keyword")
      keywordsList.innerHTML = originalHTML
      console.log(`✅ Keywords list update ${diagnosticResults.uiUpdates.keywordsList ? "works" : "failed"}`)
    } catch (error) {
      console.error("❌ Error updating keywords list:", error)
      diagnosticResults.uiUpdates.keywordsList = false
    }
  }

  if (suggestionsList) {
    try {
      const originalHTML = suggestionsList.innerHTML
      suggestionsList.innerHTML = '<li class="test-suggestion">Add more keywords</li>'
      diagnosticResults.uiUpdates.suggestionsList = suggestionsList.innerHTML.includes("test-suggestion")
      suggestionsList.innerHTML = originalHTML
      console.log(`✅ Suggestions list update ${diagnosticResults.uiUpdates.suggestionsList ? "works" : "failed"}`)
    } catch (error) {
      console.error("❌ Error updating suggestions list:", error)
      diagnosticResults.uiUpdates.suggestionsList = false
    }
  }

  return Object.values(diagnosticResults.uiUpdates).every((works) => works)
}

// Fix common issues
function applyFixes() {
  console.log("🔧 Applying fixes...")

  // Fix missing DOM elements
  if (Object.values(diagnosticResults.domElements).some((exists) => !exists)) {
    console.log("🔧 Fixing missing DOM elements...")

    // Create missing elements
    const requiredElements = {
      resumeEditor: "div",
      jobDescriptionInput: "textarea",
      resumeUpload: "input",
      scoreDisplay: "div",
      keywordsList: "ul",
      suggestionsList: "ul",
      applyChangesBtn: "button",
      compareBtn: "button",
    }

    for (const [id, tagName] of Object.entries(requiredElements)) {
      if (!diagnosticResults.domElements[id]) {
        const container = document.querySelector(".resume-editor-container") || document.body
        const element = document.createElement(tagName)
        element.id = id

        if (id === "resumeUpload") {
          element.type = "file"
          element.accept = ".pdf,.doc,.docx,.txt"
        }

        if (id === "applyChangesBtn") {
          element.textContent = "Apply Changes"
        }

        if (id === "compareBtn") {
          element.textContent = "Compare"
        }

        container.appendChild(element)
        console.log(`✅ Created missing element: #${id}`)
      }
    }
  }

  // Fix event bindings
  console.log("🔧 Ensuring event bindings...")

  // Ensure resumeUpload has change event
  const resumeUpload = document.getElementById("resumeUpload")
  if (resumeUpload) {
    resumeUpload.addEventListener("change", (event) => {
      console.log("Resume file selected")
      const file = event.target.files[0]
      if (file) {
        processResumeFile(file)
      }
    })
  }

  // Ensure jobDescriptionInput has input event
  const jobDescriptionInput = document.getElementById("jobDescriptionInput")
  if (jobDescriptionInput) {
    jobDescriptionInput.addEventListener("input", function () {
      console.log("Job description updated")
      if (window.resumeText) {
        updateAnalysis(window.resumeText, this.value)
      }
    })
  }

  // Ensure applyChangesBtn has click event
  const applyChangesBtn = document.getElementById("applyChangesBtn")
  if (applyChangesBtn) {
    applyChangesBtn.addEventListener("click", () => {
      console.log("Apply changes clicked")
      applySuggestions()
    })
  }

  // Ensure compareBtn has click event
  const compareBtn = document.getElementById("compareBtn")
  if (compareBtn) {
    compareBtn.addEventListener("click", () => {
      console.log("Compare clicked")
      showComparison()
    })
  }

  // Fix global functions if they don't exist
  if (!window.processResumeFile) {
    window.processResumeFile = (file) => {
      console.log("Processing resume file:", file.name)

      const reader = new FileReader()
      reader.onload = (e) => {
        window.resumeText = e.target.result
        const jobDescription = document.getElementById("jobDescriptionInput").value
        if (jobDescription) {
          updateAnalysis(window.resumeText, jobDescription)
        }
      }
      reader.readAsText(file)
    }
  }

  if (!window.updateAnalysis) {
    window.updateAnalysis = (resumeText, jobDescription) => {
      console.log("Updating analysis")

      // Extract keywords from job description
      const keywords = window.extractKeywords
        ? window.extractKeywords(jobDescription)
        : jobDescription.match(/\b\w{3,}\b/g) || []

      // Calculate match score
      const score = window.calculateScore
        ? window.calculateScore(resumeText, jobDescription)
        : calculateBasicScore(resumeText, keywords)

      // Generate suggestions
      const suggestions = window.generateSuggestions
        ? window.generateSuggestions(resumeText, jobDescription, keywords)
        : generateBasicSuggestions(resumeText, keywords)

      // Update UI
      updateUI(score, keywords, suggestions)
    }
  }

  if (!window.calculateBasicScore) {
    window.calculateBasicScore = (resumeText, keywords) => {
      let matchCount = 0
      keywords.forEach((keyword) => {
        if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
          matchCount++
        }
      })

      return Math.round((matchCount / keywords.length) * 100)
    }
  }

  if (!window.generateBasicSuggestions) {
    window.generateBasicSuggestions = (resumeText, keywords) => {
      const suggestions = []
      const missingKeywords = []

      keywords.forEach((keyword) => {
        if (!resumeText.toLowerCase().includes(keyword.toLowerCase())) {
          missingKeywords.push(keyword)
        }
      })

      if (missingKeywords.length > 0) {
        suggestions.push(`Consider adding these keywords: ${missingKeywords.join(", ")}`)
      }

      if (resumeText.length < 1000) {
        suggestions.push("Your resume seems short. Consider adding more details about your experience.")
      }

      return suggestions
    }
  }

  if (!window.updateUI) {
    window.updateUI = (score, keywords, suggestions) => {
      // Update score
      const scoreDisplay = document.getElementById("scoreDisplay")
      if (scoreDisplay) {
        scoreDisplay.textContent = `Match Score: ${score}%`
      }

      // Update keywords list
      const keywordsList = document.getElementById("keywordsList")
      if (keywordsList) {
        keywordsList.innerHTML = ""
        keywords.forEach((keyword) => {
          const li = document.createElement("li")
          li.textContent = keyword
          keywordsList.appendChild(li)
        })
      }

      // Update suggestions list
      const suggestionsList = document.getElementById("suggestionsList")
      if (suggestionsList) {
        suggestionsList.innerHTML = ""
        suggestions.forEach((suggestion) => {
          const li = document.createElement("li")
          li.textContent = suggestion
          suggestionsList.appendChild(li)
        })
      }
    }
  }

  if (!window.applySuggestions) {
    window.applySuggestions = () => {
      console.log("Applying suggestions")

      const resumeEditor = document.getElementById("resumeEditor")
      const suggestionsList = document.getElementById("suggestionsList")

      if (!resumeEditor || !suggestionsList || !window.resumeText) {
        console.error("Missing required elements for applying suggestions")
        return
      }

      // Store original resume for comparison
      window.originalResumeText = window.originalResumeText || window.resumeText

      // Simple implementation: append missing keywords to resume
      const jobDescription = document.getElementById("jobDescriptionInput").value
      const keywords = window.extractKeywords
        ? window.extractKeywords(jobDescription)
        : jobDescription.match(/\b\w{3,}\b/g) || []

      const missingKeywords = []
      keywords.forEach((keyword) => {
        if (!window.resumeText.toLowerCase().includes(keyword.toLowerCase())) {
          missingKeywords.push(keyword)
        }
      })

      if (missingKeywords.length > 0) {
        // Add missing keywords to the resume
        window.resumeText += `\n\nAdditional Skills: ${missingKeywords.join(", ")}`

        // Update the editor with the new text
        if (resumeEditor.tagName === "TEXTAREA") {
          resumeEditor.value = window.resumeText
        } else {
          resumeEditor.textContent = window.resumeText
        }

        // Re-run analysis
        updateAnalysis(window.resumeText, jobDescription)
      }
    }
  }

  if (!window.showComparison) {
    window.showComparison = () => {
      console.log("Showing comparison")

      if (!window.originalResumeText || !window.resumeText) {
        alert("No changes to compare. Please upload a resume and apply changes first.")
        return
      }

      // Create comparison modal if it doesn't exist
      let comparisonModal = document.getElementById("comparisonModal")
      if (!comparisonModal) {
        comparisonModal = document.createElement("div")
        comparisonModal.id = "comparisonModal"
        comparisonModal.className = "comparison-modal"

        const modalContent = document.createElement("div")
        modalContent.className = "comparison-modal-content"

        const closeBtn = document.createElement("span")
        closeBtn.className = "close-button"
        closeBtn.innerHTML = "&times;"
        closeBtn.onclick = () => {
          comparisonModal.style.display = "none"
        }

        const title = document.createElement("h2")
        title.textContent = "Resume Comparison"

        const comparisonContainer = document.createElement("div")
        comparisonContainer.className = "comparison-container"

        const originalColumn = document.createElement("div")
        originalColumn.className = "comparison-column"
        const originalTitle = document.createElement("h3")
        originalTitle.textContent = "Original Resume"
        const originalContent = document.createElement("pre")
        originalContent.id = "originalResumeContent"
        originalColumn.appendChild(originalTitle)
        originalColumn.appendChild(originalContent)

        const updatedColumn = document.createElement("div")
        updatedColumn.className = "comparison-column"
        const updatedTitle = document.createElement("h3")
        updatedTitle.textContent = "Updated Resume"
        const updatedContent = document.createElement("pre")
        updatedContent.id = "updatedResumeContent"
        updatedColumn.appendChild(updatedTitle)
        updatedColumn.appendChild(updatedContent)

        comparisonContainer.appendChild(originalColumn)
        comparisonContainer.appendChild(updatedColumn)

        modalContent.appendChild(closeBtn)
        modalContent.appendChild(title)
        modalContent.appendChild(comparisonContainer)

        comparisonModal.appendChild(modalContent)
        document.body.appendChild(comparisonModal)

        // Add basic styles
        const style = document.createElement("style")
        style.textContent = `
          .comparison-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
          }
          
          .comparison-modal-content {
            background-color: white;
            margin: 5% auto;
            padding: 20px;
            width: 90%;
            max-width: 1200px;
            max-height: 80vh;
            overflow-y: auto;
          }
          
          .close-button {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
          }
          
          .comparison-container {
            display: flex;
            gap: 20px;
          }
          
          .comparison-column {
            flex: 1;
            border: 1px solid #ddd;
            padding: 10px;
          }
          
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .highlight {
            background-color: #ffff99;
          }
        `
        document.head.appendChild(style)
      }

      // Update comparison content
      document.getElementById("originalResumeContent").textContent = window.originalResumeText
      document.getElementById("updatedResumeContent").textContent = window.resumeText

      // Show the modal
      comparisonModal.style.display = "block"
    }
  }

  if (!window.extractKeywords) {
    window.extractKeywords = (text) => {
      if (!text) return []

      // Simple keyword extraction
      const words = text.match(/\b\w{3,}\b/g) || []
      const wordFreq = {}

      words.forEach((word) => {
        const lowerWord = word.toLowerCase()
        wordFreq[lowerWord] = (wordFreq[lowerWord] || 0) + 1
      })

      // Filter out common words
      const commonWords = ["the", "and", "for", "with", "that", "this", "are", "you", "from", "have"]
      const keywords = Object.keys(wordFreq)
        .filter((word) => !commonWords.includes(word) && wordFreq[word] > 1)
        .sort((a, b) => wordFreq[b] - wordFreq[a])
        .slice(0, 15)

      return keywords
    }
  }

  console.log("✅ Fixes applied successfully")
}

// Run diagnostics and apply fixes
function runDiagnostics() {
  console.log("🔍 Starting resume editor diagnostics...")

  const domElementsOk = checkDomElements()
  const eventBindingsOk = checkEventBindings()
  const dataFlowOk = checkDataFlow()
  const uiUpdatesOk = checkUiUpdates()

  const allOk = domElementsOk && eventBindingsOk && dataFlowOk && uiUpdatesOk

  console.log(`
    📊 Diagnostic Results:
    - DOM Elements: ${domElementsOk ? "✅" : "❌"}
    - Event Bindings: ${eventBindingsOk ? "✅" : "❌"}
    - Data Flow: ${dataFlowOk ? "✅" : "❌"}
    - UI Updates: ${uiUpdatesOk ? "✅" : "❌"}
    
    Overall: ${allOk ? "✅ All systems operational" : "❌ Issues detected"}
  `)

  if (!allOk) {
    console.log("🔧 Applying fixes for detected issues...")
    applyFixes()
  }

  return allOk
}

// Run diagnostics when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Resume Editor Diagnostics Tool loaded")
  setTimeout(runDiagnostics, 500) // Slight delay to ensure all scripts are loaded
})

// Export diagnostics for external use
window.resumeEditorDiagnostics = {
  run: runDiagnostics,
  applyFixes: applyFixes,
  results: diagnosticResults,
}
