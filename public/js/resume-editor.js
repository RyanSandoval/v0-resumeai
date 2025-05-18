/**
 * Real-time Resume Editor
 * Provides interactive resume editing with live score updates
 */

;(() => {
  // Configuration
  const CONFIG = {
    // Debounce delay for analysis (ms)
    analysisDelay: 800,
    // Maximum number of suggestions to show
    maxSuggestions: 8,
    // Highlight colors
    colors: {
      added: "#c6f6d5", // Light green
      removed: "#fed7d7", // Light red
      matched: "#e9d8fd", // Light purple
      improved: "#bee3f8", // Light blue
    },
    // Maximum file size in bytes (10MB)
    maxFileSize: 10 * 1024 * 1024,
    // Supported file types
    supportedFileTypes: [".pdf", ".doc", ".docx", ".txt", ".rtf"],
  }

  // Track editor state
  const editorState = {
    originalText: "",
    currentText: "",
    suggestions: [],
    appliedSuggestions: [],
    analysisResults: null,
    viewMode: "edit", // 'edit', 'original', 'optimized', 'comparison'
    isAnalyzing: false,
    changesSaved: true,
    analysisTimeout: null,
    jobDescription: "",
    lastError: null,
    processingFile: false,
  }

  // Debug helper
  const debug = {
    log: (message, data) => {
      if (window.DEBUG_MODE) {
        console.log(`[Resume Editor] ${message}`, data || "")
      }
    },
    error: (message, error) => {
      console.error(`[Resume Editor Error] ${message}`, error || "")
    },
    checkElement: (id) => {
      const element = document.getElementById(id)
      if (!element) {
        debug.error(`Element not found: #${id}`)
        return false
      }
      return true
    },
  }

  /**
   * Initialize the resume editor
   * @param {string} resumeText - The initial resume text
   * @param {Object} initialAnalysis - Initial analysis results
   * @param {string} jobDescription - The job description
   */
  function initResumeEditor(resumeText, initialAnalysis, jobDescription = "") {
    debug.log("Initializing resume editor with text length:", resumeText?.length)

    try {
      // Store initial state
      editorState.originalText = resumeText || ""
      editorState.currentText = resumeText || ""
      editorState.analysisResults = initialAnalysis || null
      editorState.jobDescription = jobDescription || ""

      // Set up the editor
      setupEditor()

      // Set up view mode toggles
      setupViewModeToggles()

      // Set up suggestion handling
      setupSuggestionHandlers()

      // Generate initial suggestions
      if (initialAnalysis) {
        generateSuggestions(initialAnalysis)
      }

      // Update UI with initial state
      updateUI()

      debug.log("Resume editor initialized successfully")
    } catch (error) {
      debug.error("Error initializing resume editor:", error)
      showErrorMessage("Failed to initialize the resume editor. Please refresh the page and try again.")
    }
  }

  /**
   * Set up the resume editor
   */
  function setupEditor() {
    const editor = document.getElementById("resumeEditor")
    if (!editor) {
      debug.error("Resume editor element not found!")
      return
    }

    try {
      // Set initial content
      editor.value = editorState.currentText

      // Add event listeners
      editor.addEventListener("input", handleEditorInput)

      // Add auto-save functionality
      editor.addEventListener("blur", saveChanges)

      // Set up keyboard shortcuts
      editor.addEventListener("keydown", handleKeyboardShortcuts)

      debug.log("Editor setup complete")
    } catch (error) {
      debug.error("Error setting up editor:", error)
    }
  }

  /**
   * Handle input in the editor
   * @param {Event} event - The input event
   */
  function handleEditorInput(event) {
    try {
      // Update current text
      editorState.currentText = event.target.value

      // Mark changes as unsaved
      editorState.changesSaved = false

      // Show saving indicator
      updateSavingStatus("Editing...")

      // Debounce analysis to avoid too frequent updates
      clearTimeout(editorState.analysisTimeout)
      editorState.analysisTimeout = setTimeout(() => {
        analyzeResume()
      }, CONFIG.analysisDelay)
    } catch (error) {
      debug.error("Error handling editor input:", error)
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + S to save
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault()
      saveChanges()
    }
  }

  /**
   * Save changes to the resume
   */
  function saveChanges() {
    if (editorState.changesSaved) return

    // Update saving status
    updateSavingStatus("Saving...")

    // Simulate saving delay
    setTimeout(() => {
      editorState.changesSaved = true
      updateSavingStatus("Changes saved")

      // Clear status after a delay
      setTimeout(() => {
        updateSavingStatus("")
      }, 2000)
    }, 600)
  }

  /**
   * Update the saving status indicator
   * @param {string} message - The status message
   */
  function updateSavingStatus(message) {
    const statusElement = document.getElementById("editorStatus")
    if (statusElement) {
      statusElement.textContent = message
    }
  }

  /**
   * Analyze the resume in real-time
   */
  function analyzeResume() {
    // Set analyzing state
    editorState.isAnalyzing = true
    updateAnalysisStatus("Analyzing...")

    try {
      // Get job description
      const jobDescription = editorState.jobDescription || document.getElementById("jobDescription")?.value || ""

      if (!jobDescription) {
        throw new Error("Job description not found")
      }

      // Get additional keywords
      const additionalKeywords = getAdditionalKeywords()

      // Check if analysis function exists
      if (typeof window.analyzeKeywordMatch !== "function") {
        throw new Error("Analysis function not available")
      }

      // Perform analysis
      const results = window.analyzeKeywordMatch(editorState.currentText, jobDescription, additionalKeywords)

      // Update state with new results
      editorState.analysisResults = results

      // Generate new suggestions
      generateSuggestions(results)

      // Update UI with new results
      updateUI()

      // Update analysis status
      updateAnalysisStatus("Analysis complete")
      setTimeout(() => updateAnalysisStatus(""), 2000)

      // Update the main score display
      updateMainScoreDisplay(results)

      // Update keyword lists
      updateKeywordLists(results)

      // Clear any previous errors
      editorState.lastError = null
      hideErrorMessage()
    } catch (error) {
      debug.error("Error analyzing resume:", error)
      editorState.lastError = error
      updateAnalysisStatus("Analysis failed: " + (error.message || "Unknown error"))
      showErrorMessage("Analysis failed: " + (error.message || "Unknown error"))
    } finally {
      // Reset analyzing state
      editorState.isAnalyzing = false
    }
  }

  /**
   * Update the main score display in the results area
   */
  function updateMainScoreDisplay(results) {
    if (!results) return

    const scoreCircle = document.getElementById("scoreCircle")
    const scoreText = document.getElementById("scoreText")

    if (scoreCircle && scoreText) {
      scoreCircle.style.strokeDasharray = `${results.score}, 100`
      scoreText.textContent = `${results.score}%`
    }
  }

  /**
   * Update the keyword lists in the main UI
   */
  function updateKeywordLists(results) {
    if (!results) return

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
          <span class="keyword-text">${sanitizeHTML(keyword.text)}</span>
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
          <span class="keyword-text">${sanitizeHTML(keyword)}</span>
          <button class="keyword-add" data-keyword="${sanitizeHTML(keyword)}">Add</button>
        `

        // Add event listener to add button
        keywordElement.querySelector(".keyword-add").addEventListener("click", () => {
          addKeywordToResume(keyword)
        })

        missingContainer.appendChild(keywordElement)
      })
    } else {
      missingContainer.innerHTML = "<p class='empty-list'>No missing keywords found</p>"
    }
  }

  /**
   * Get additional keywords from the UI
   * @returns {Array<string>} - Array of additional keywords
   */
  function getAdditionalKeywords() {
    const keywordElements = document.querySelectorAll(".keyword-tag")
    const keywords = []

    keywordElements.forEach((element) => {
      const keyword = element.textContent.trim().replace("×", "").trim()
      if (keyword) {
        keywords.push(keyword)
      }
    })

    return keywords
  }

  /**
   * Update analysis status
   * @param {string} message - The status message
   */
  function updateAnalysisStatus(message) {
    const statusElement = document.getElementById("analysisStatus")
    if (statusElement) {
      statusElement.textContent = message
    }
  }

  /**
   * Generate improvement suggestions based on analysis
   * @param {Object} analysis - The analysis results
   */
  function generateSuggestions(analysis) {
    if (!analysis) return

    const suggestions = []

    // Add missing keywords suggestions
    if (analysis.missingKeywords && analysis.missingKeywords.length > 0) {
      // Group similar keywords
      const keywordGroups = groupSimilarKeywords(analysis.missingKeywords)

      keywordGroups.forEach((group) => {
        if (group.length === 1) {
          suggestions.push({
            type: "keyword",
            text: `Add the keyword "${group[0]}" to your resume`,
            keyword: group[0],
            action: () => addKeywordToResume(group[0]),
          })
        } else {
          suggestions.push({
            type: "keyword-group",
            text: `Add one of these similar keywords: ${group.join(", ")}`,
            keywords: group,
            action: () => showKeywordSelectionDialog(group),
          })
        }
      })
    }

    // Add section improvement suggestions
    const weakSections = identifyWeakSections(editorState.currentText)
    weakSections.forEach((section) => {
      suggestions.push({
        type: "section",
        text: `Add or improve your ${section} section`,
        section: section,
        action: () => addSectionTemplate(section),
      })
    })

    // Add action verb suggestions
    if (!hasStrongActionVerbs(editorState.currentText)) {
      suggestions.push({
        type: "action-verbs",
        text: "Use more powerful action verbs in your experience descriptions",
        action: () => showActionVerbSuggestions(),
      })
    }

    // Add quantification suggestion
    if (!hasQuantifiedAchievements(editorState.currentText)) {
      suggestions.push({
        type: "quantify",
        text: "Quantify your achievements with numbers and percentages",
        action: () => showQuantificationExamples(),
      })
    }

    // Add bullet point suggestion if needed
    if (!hasBulletPoints(editorState.currentText)) {
      suggestions.push({
        type: "format",
        text: "Use bullet points to list your achievements and responsibilities",
        action: () => formatWithBulletPoints(),
      })
    }

    // Limit to max suggestions
    editorState.suggestions = suggestions.slice(0, CONFIG.maxSuggestions)
  }

  /**
   * Group similar keywords to avoid redundant suggestions
   * @param {Array<string>} keywords - List of keywords
   * @returns {Array<Array<string>>} - Grouped keywords
   */
  function groupSimilarKeywords(keywords) {
    const groups = []
    const processed = new Set()

    keywords.forEach((keyword) => {
      if (processed.has(keyword)) return

      const group = [keyword]
      processed.add(keyword)

      // Find similar keywords (simple implementation)
      keywords.forEach((other) => {
        if (other !== keyword && !processed.has(other) && areSimilarKeywords(keyword, other)) {
          group.push(other)
          processed.add(other)
        }
      })

      groups.push(group)
    })

    return groups
  }

  /**
   * Check if two keywords are similar
   * @param {string} keyword1 - First keyword
   * @param {string} keyword2 - Second keyword
   * @returns {boolean} - Whether the keywords are similar
   */
  function areSimilarKeywords(keyword1, keyword2) {
    // Simple implementation - check if one is contained in the other
    return keyword1.includes(keyword2) || keyword2.includes(keyword1)
  }

  /**
   * Identify weak sections in the resume
   * @param {string} text - The resume text
   * @returns {Array<string>} - List of weak or missing sections
   */
  function identifyWeakSections(text) {
    const sections = ["summary", "experience", "education", "skills", "projects", "certifications"]
    const lowercaseText = text.toLowerCase()

    return sections.filter((section) => {
      return !lowercaseText.includes(section.toLowerCase()) || lowercaseText.split(section.toLowerCase()).length < 2
    })
  }

  /**
   * Check if the resume has strong action verbs
   * @param {string} text - The resume text
   * @returns {boolean} - Whether the resume has strong action verbs
   */
  function hasStrongActionVerbs(text) {
    const strongVerbs = [
      "achieved",
      "improved",
      "increased",
      "reduced",
      "managed",
      "developed",
      "created",
      "implemented",
      "designed",
      "launched",
      "led",
      "coordinated",
      "delivered",
      "generated",
    ]

    const lowercaseText = text.toLowerCase()
    let count = 0

    strongVerbs.forEach((verb) => {
      if (lowercaseText.includes(verb)) {
        count++
      }
    })

    return count >= 5 // At least 5 strong verbs
  }

  /**
   * Check if the resume has quantified achievements
   * @param {string} text - The resume text
   * @returns {boolean} - Whether the resume has quantified achievements
   */
  function hasQuantifiedAchievements(text) {
    const patterns = [/\d+%/, /\d+ percent/, /increased by \d+/, /reduced by \d+/, /\$\d+/, /\d+ people/, /team of \d+/]

    return patterns.some((pattern) => pattern.test(text))
  }

  /**
   * Check if the resume uses bullet points
   * @param {string} text - The resume text
   * @returns {boolean} - Whether the resume uses bullet points
   */
  function hasBulletPoints(text) {
    return text.includes("•") || (text.includes("-") && /\n\s*-/.test(text))
  }

  /**
   * Add a keyword to the resume
   * @param {string} keyword - The keyword to add
   */
  function addKeywordToResume(keyword) {
    if (!keyword) return

    debug.log("Adding keyword to resume:", keyword)

    // Find appropriate section to add keyword
    const section = findBestSectionForKeyword(keyword)

    // Get editor
    const editor = document.getElementById("resumeEditor")
    if (!editor) {
      debug.error("Editor element not found")
      return
    }

    // Find section in text
    const text = editor.value
    const sectionRegex = new RegExp(`\\b${section}\\b.*\\n`, "i")
    const match = text.match(sectionRegex)

    if (match) {
      // Add keyword to section
      const index = match.index + match[0].length
      const newText = text.substring(0, index) + `• Proficient in ${keyword}\n` + text.substring(index)

      // Update editor
      editor.value = newText
      editorState.currentText = newText

      // Trigger analysis
      handleEditorInput({ target: editor })

      // Track applied suggestion
      trackAppliedSuggestion("keyword", keyword)
    } else {
      // If section not found, add to skills section or create one
      addSkillsSection(keyword)
    }
  }

  /**
   * Find the best section to add a keyword
   * @param {string} keyword - The keyword to add
   * @returns {string} - The section name
   */
  function findBestSectionForKeyword(keyword) {
    // Simple logic - technical keywords go to skills, others to experience
    const technicalKeywords = [
      "java",
      "python",
      "javascript",
      "react",
      "angular",
      "vue",
      "node",
      "express",
      "mongodb",
      "sql",
      "nosql",
      "aws",
      "azure",
      "gcp",
      "cloud",
      "docker",
      "kubernetes",
      "devops",
      "ci/cd",
      "git",
      "agile",
      "scrum",
    ]

    const lowercaseKeyword = keyword.toLowerCase()

    for (const tech of technicalKeywords) {
      if (lowercaseKeyword.includes(tech)) {
        return "skills"
      }
    }

    return "experience"
  }

  /**
   * Add a skills section with the keyword
   * @param {string} keyword - The keyword to add
   */
  function addSkillsSection(keyword) {
    // Get editor
    const editor = document.getElementById("resumeEditor")
    if (!editor) return

    // Check if skills section exists
    const text = editor.value
    if (/\bskills\b/i.test(text)) {
      // Find skills section and add keyword
      const skillsRegex = /\bskills\b.*\n/i
      const match = text.match(skillsRegex)

      if (match) {
        const index = match.index + match[0].length
        const newText = text.substring(0, index) + `• ${keyword}\n` + text.substring(index)

        editor.value = newText
        editorState.currentText = newText
      }
    } else {
      // Create skills section
      const newText = text + "\n\nSKILLS\n" + `• ${keyword}\n`

      editor.value = newText
      editorState.currentText = newText
    }

    // Trigger analysis
    handleEditorInput({ target: editor })

    // Track applied suggestion
    trackAppliedSuggestion("section", "skills")
  }

  /**
   * Show dialog to select a keyword from a group
   * @param {Array<string>} keywords - The keywords to choose from
   */
  function showKeywordSelectionDialog(keywords) {
    // Remove any existing dialogs
    const existingDialog = document.querySelector(".keyword-selection-dialog")
    if (existingDialog) {
      document.body.removeChild(existingDialog)
    }

    // Create modal dialog
    const dialog = document.createElement("div")
    dialog.className = "keyword-selection-dialog"
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Select a keyword to add</h3>
        <p>Choose the most relevant keyword for your resume:</p>
        <div class="keyword-options">
          ${keywords
            .map(
              (keyword) =>
                `<button class="keyword-option" data-keyword="${sanitizeHTML(keyword)}">${sanitizeHTML(keyword)}</button>`,
            )
            .join("")}
        </div>
        <div class="dialog-actions">
          <button class="dialog-cancel">Cancel</button>
        </div>
      </div>
    `

    // Add event listeners
    dialog.querySelectorAll(".keyword-option").forEach((button) => {
      button.addEventListener("click", () => {
        const keyword = button.getAttribute("data-keyword")
        addKeywordToResume(keyword)
        document.body.removeChild(dialog)
      })
    })

    dialog.querySelector(".dialog-cancel").addEventListener("click", () => {
      document.body.removeChild(dialog)
    })

    // Add to body
    document.body.appendChild(dialog)
  }

  /**
   * Show action verb suggestions
   */
  function showActionVerbSuggestions() {
    // Remove any existing dialogs
    const existingDialog = document.querySelector(".action-verb-dialog")
    if (existingDialog) {
      document.body.removeChild(existingDialog)
    }

    // Create modal dialog
    const dialog = document.createElement("div")
    dialog.className = "action-verb-dialog"
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Powerful Action Verbs</h3>
        <p>Replace weak verbs with these powerful alternatives:</p>
        <div class="verb-categories">
          <div class="verb-category">
            <h4>Leadership</h4>
            <div class="verb-list">
              <span class="verb">Led</span>
              <span class="verb">Managed</span>
              <span class="verb">Directed</span>
              <span class="verb">Coordinated</span>
              <span class="verb">Oversaw</span>
              <span class="verb">Supervised</span>
            </div>
          </div>
          <div class="verb-category">
            <h4>Achievement</h4>
            <div class="verb-list">
              <span class="verb">Achieved</span>
              <span class="verb">Improved</span>
              <span class="verb">Increased</span>
              <span class="verb">Reduced</span>
              <span class="verb">Exceeded</span>
              <span class="verb">Surpassed</span>
            </div>
          </div>
          <div class="verb-category">
            <h4>Creation</h4>
            <div class="verb-list">
              <span class="verb">Created</span>
              <span class="verb">Developed</span>
              <span class="verb">Designed</span>
              <span class="verb">Implemented</span>
              <span class="verb">Launched</span>
              <span class="verb">Established</span>
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-close">Close</button>
        </div>
      </div>
    `

    // Add event listeners
    dialog.querySelectorAll(".verb").forEach((verb) => {
      verb.addEventListener("click", () => {
        // Copy to clipboard
        navigator.clipboard
          .writeText(verb.textContent)
          .then(() => {
            verb.classList.add("copied")
            setTimeout(() => verb.classList.remove("copied"), 1000)
          })
          .catch((err) => {
            debug.error("Failed to copy text: ", err)
            alert("Failed to copy to clipboard. Please copy manually.")
          })
      })
    })

    dialog.querySelector(".dialog-close").addEventListener("click", () => {
      document.body.removeChild(dialog)
    })

    // Add to body
    document.body.appendChild(dialog)

    // Track applied suggestion
    trackAppliedSuggestion("action-verbs", "viewed")
  }

  /**
   * Show quantification examples
   */
  function showQuantificationExamples() {
    // Remove any existing dialogs
    const existingDialog = document.querySelector(".quantification-dialog")
    if (existingDialog) {
      document.body.removeChild(existingDialog)
    }

    // Create modal dialog
    const dialog = document.createElement("div")
    dialog.className = "quantification-dialog"
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Quantify Your Achievements</h3>
        <p>Add numbers to make your achievements more impactful:</p>
        <div class="example-list">
          <div class="example">
            <div class="example-before">Increased sales for the company</div>
            <div class="example-after">Increased sales by 27% over 6 months, generating $450K in additional revenue</div>
          </div>
          <div class="example">
            <div class="example-before">Managed a team</div>
            <div class="example-after">Managed a cross-functional team of 12 people across 3 departments</div>
          </div>
          <div class="example">
            <div class="example-before">Reduced customer complaints</div>
            <div class="example-after">Reduced customer complaints by 35% by implementing new training program</div>
          </div>
          <div class="example">
            <div class="example-before">Improved website performance</div>
            <div class="example-after">Improved website load time by 40%, increasing conversion rate by 15%</div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-close">Close</button>
        </div>
      </div>
    `

    // Add event listeners
    dialog.querySelector(".dialog-close").addEventListener("click", () => {
      document.body.removeChild(dialog)
    })

    // Add to body
    document.body.appendChild(dialog)

    // Track applied suggestion
    trackAppliedSuggestion("quantify", "viewed")
  }

  /**
   * Format resume with bullet points
   */
  function formatWithBulletPoints() {
    // Get editor
    const editor = document.getElementById("resumeEditor")
    if (!editor) return

    // Get text
    const text = editor.value

    // Find experience section
    const expMatch = text.match(/\bexperience\b.*?\n/i)
    if (!expMatch) return

    const expIndex = expMatch.index + expMatch[0].length

    // Find next section
    const nextSectionMatch = text.substring(expIndex).match(/\n\s*\b(education|skills|projects|certifications)\b/i)
    const nextSectionIndex = nextSectionMatch ? expIndex + nextSectionMatch.index : text.length

    // Get experience section content
    const expContent = text.substring(expIndex, nextSectionIndex)

    // Format with bullet points
    const formattedContent = formatExperienceWithBullets(expContent)

    // Replace in text
    const newText = text.substring(0, expIndex) + formattedContent + text.substring(nextSectionIndex)

    // Update editor
    editor.value = newText
    editorState.currentText = newText

    // Trigger analysis
    handleEditorInput({ target: editor })

    // Track applied suggestion
    trackAppliedSuggestion("format", "bullet-points")
  }

  /**
   * Format experience section with bullet points
   * @param {string} content - The experience section content
   * @returns {string} - Formatted content
   */
  function formatExperienceWithBullets(content) {
    // Split into lines
    const lines = content.split("\n")
    let formatted = ""
    let inJobDescription = false

    lines.forEach((line) => {
      line = line.trim()
      if (!line) {
        formatted += "\n"
        return
      }

      // Check if this is a job title/company line
      if (line.includes("|") || /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b.*\d{4}/i.test(line)) {
        inJobDescription = false
        formatted += line + "\n"
      } else if (line.match(/^[A-Z]/) && line.length < 60) {
        // Likely a job title or company
        inJobDescription = true
        formatted += line + "\n"
      } else if (inJobDescription && !line.startsWith("•") && !line.startsWith("-")) {
        // Job description that needs bullets
        formatted += "• " + line + "\n"
      } else {
        formatted += line + "\n"
      }
    })

    return formatted
  }

  /**
   * Add a section template to the resume
   * @param {string} sectionName - The section to add
   */
  function addSectionTemplate(sectionName) {
    // Get editor
    const editor = document.getElementById("resumeEditor")
    if (!editor) return

    // Get template for section
    const template = getSectionTemplate(sectionName)

    // Add to end of resume
    const newText = editor.value + "\n\n" + template

    // Update editor
    editor.value = newText
    editorState.currentText = newText

    // Trigger analysis
    handleEditorInput({ target: editor })

    // Track applied suggestion
    trackAppliedSuggestion("section", sectionName)
  }

  /**
   * Get template for a section
   * @param {string} sectionName - The section name
   * @returns {string} - The section template
   */
  function getSectionTemplate(sectionName) {
    switch (sectionName.toLowerCase()) {
      case "summary":
        return "SUMMARY\nExperienced [Your Profession] with [X] years of expertise in [Key Skill 1], [Key Skill 2], and [Key Skill 3]. Proven track record of [Notable Achievement] resulting in [Measurable Outcome]. Seeking to leverage my skills in [Relevant Area] to [Career Goal]."

      case "experience":
        return "EXPERIENCE\n[Company Name] | [Location]\n[Job Title] | [Start Date] - [End Date/Present]\n• Achieved [specific accomplishment] resulting in [measurable outcome]\n• Led [project or initiative] that [specific result]\n• Improved [process or system] by [specific action], which [measurable outcome]"

      case "education":
        return "EDUCATION\n[University Name] | [Location]\n[Degree Type] in [Field of Study] | [Graduation Date]\n• GPA: [Your GPA] / 4.0\n• Relevant Coursework: [Course 1], [Course 2], [Course 3]\n• [Academic Achievement or Honor]"

      case "skills":
        return "SKILLS\n• Technical: [Skill 1], [Skill 2], [Skill 3]\n• Software: [Software 1], [Software 2], [Software 3]\n• Languages: [Language 1], [Language 2]\n• Certifications: [Certification 1], [Certification 2]"

      case "projects":
        return "PROJECTS\n[Project Name]\n• Developed [what you built] using [technologies/tools]\n• Implemented [key feature] that [specific benefit]\n• Collaborated with [team size] to [project outcome]"

      case "certifications":
        return "CERTIFICATIONS\n• [Certification Name] - [Issuing Organization], [Date]\n• [Certification Name] - [Issuing Organization], [Date]"

      default:
        return `${sectionName.toUpperCase()}\n• [Add your ${sectionName} details here]`
    }
  }

  /**
   * Track applied suggestion
   * @param {string} type - The suggestion type
   * @param {string} value - The suggestion value
   */
  function trackAppliedSuggestion(type, value) {
    editorState.appliedSuggestions.push({
      type,
      value,
      timestamp: new Date().toISOString(),
    })

    // Update applied suggestions counter
    updateAppliedSuggestionsCounter()
  }

  /**
   * Update applied suggestions counter
   */
  function updateAppliedSuggestionsCounter() {
    const counter = document.getElementById("appliedSuggestionsCount")
    if (counter) {
      counter.textContent = editorState.appliedSuggestions.length
    }
  }

  /**
   * Set up view mode toggles
   */
  function setupViewModeToggles() {
    const toggles = document.querySelectorAll(".view-mode-toggle")
    if (!toggles.length) {
      debug.warn("View mode toggles not found")
      return
    }

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const mode = toggle.getAttribute("data-mode")
        if (mode) {
          setViewMode(mode)

          // Update active toggle
          toggles.forEach((t) => t.classList.remove("active"))
          toggle.classList.add("active")
        }
      })
    })
  }

  /**
   * Set the view mode
   * @param {string} mode - The view mode
   */
  function setViewMode(mode) {
    editorState.viewMode = mode
    updateViewMode()
  }

  /**
   * Update the view based on current mode
   */
  function updateViewMode() {
    const editorContainer = document.getElementById("resumeEditorContainer")
    const editor = document.getElementById("resumeEditor")
    const comparison = document.getElementById("resumeComparison")

    if (!editorContainer || !editor || !comparison) {
      debug.error("Editor container, editor, or comparison element not found")
      return
    }

    // Reset classes
    editorContainer.className = "resume-editor-container"
    editorContainer.classList.add(`mode-${editorState.viewMode}`)

    // Update content based on mode
    switch (editorState.viewMode) {
      case "edit":
        editor.classList.remove("hidden")
        comparison.classList.add("hidden")
        break

      case "original":
        editor.classList.add("hidden")
        comparison.classList.remove("hidden")
        comparison.innerHTML = formatTextForDisplay(editorState.originalText)
        break

      case "optimized":
        editor.classList.add("hidden")
        comparison.classList.remove("hidden")
        comparison.innerHTML = formatTextForDisplay(editorState.currentText)
        break

      case "comparison":
        editor.classList.add("hidden")
        comparison.classList.remove("hidden")
        comparison.innerHTML = generateDiffView(editorState.originalText, editorState.currentText)
        break
    }
  }

  /**
   * Format text for display
   * @param {string} text - The text to format
   * @returns {string} - Formatted HTML
   */
  function formatTextForDisplay(text) {
    if (!text) return ""

    try {
      // Normalize text encoding
      text = normalizeText(text)

      // Escape HTML
      let html = sanitizeHTML(text)

      // Convert newlines to <br>
      html = html.replace(/\n/g, "<br>")

      return html
    } catch (error) {
      debug.error("Error formatting text for display:", error)
      return `<p class="error-message">Error displaying text: ${error.message}</p>`
    }
  }

  /**
   * Normalize text encoding
   * @param {string} text - The text to normalize
   * @returns {string} - Normalized text
   */
  function normalizeText(text) {
    if (!text) return ""

    try {
      // Handle common encoding issues
      return text
        .replace(/[\uFFFD\uFFFE\uFFFF]/g, "") // Remove replacement characters
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // Remove control characters
        .replace(/\uFEFF/g, "") // Remove BOM
        .normalize("NFKD") // Normalize to decomposed form
    } catch (error) {
      debug.error("Error normalizing text:", error)
      return text // Return original text if normalization fails
    }
  }

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} text - The text to sanitize
   * @returns {string} - Sanitized text
   */
  function sanitizeHTML(text) {
    if (!text) return ""

    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }

  /**
   * Generate diff view comparing original and current text
   * @param {string} original - The original text
   * @param {string} current - The current text
   * @returns {string} - HTML with highlighted differences
   */
  function generateDiffView(original, current) {
    if (!original || !current) {
      return "<p>Cannot generate comparison - missing original or current text</p>"
    }

    try {
      // Normalize text encoding
      original = normalizeText(original)
      current = normalizeText(current)

      // Simple diff implementation
      const originalLines = original.split("\n")
      const currentLines = current.split("\n")

      let html = '<div class="diff-view">'
      html += '<div class="diff-original">'
      html += "<h4>Original Resume</h4>"
      html += '<div class="diff-content">'

      originalLines.forEach((line) => {
        html += `<div class="diff-line">${formatTextForDisplay(line)}</div>`
      })

      html += "</div></div>"
      html += '<div class="diff-current">'
      html += "<h4>Optimized Resume</h4>"
      html += '<div class="diff-content">'

      // Highlight changes in current text
      const addedLines = findAddedLines(originalLines, currentLines)
      const removedLines = findRemovedLines(originalLines, currentLines)

      currentLines.forEach((line) => {
        let lineClass = "diff-line"

        if (addedLines.includes(line)) {
          lineClass += " diff-added"
        } else if (isModifiedLine(line, originalLines, removedLines)) {
          lineClass += " diff-modified"
        }

        html += `<div class="${lineClass}">${formatTextForDisplay(line)}</div>`
      })

      html += "</div></div></div>"

      return html
    } catch (error) {
      debug.error("Error generating diff view:", error)
      return `<p class="error-message">Error generating comparison: ${error.message}</p>`
    }
  }

  /**
   * Find lines that were added in the current text
   * @param {Array<string>} originalLines - Original text lines
   * @param {Array<string>} currentLines - Current text lines
   * @returns {Array<string>} - Added lines
   */
  function findAddedLines(originalLines, currentLines) {
    return currentLines.filter((line) => !originalLines.includes(line))
  }

  /**
   * Find lines that were removed from the original text
   * @param {Array<string>} originalLines - Original text lines
   * @param {Array<string>} currentLines - Current text lines
   * @returns {Array<string>} - Removed lines
   */
  function findRemovedLines(originalLines, currentLines) {
    return originalLines.filter((line) => !currentLines.includes(line))
  }

  /**
   * Check if a line is a modified version of an original line
   * @param {string} line - The line to check
   * @param {Array<string>} originalLines - Original text lines
   * @param {Array<string>} removedLines - Removed lines
   * @returns {boolean} - Whether the line is modified
   */
  function isModifiedLine(line, originalLines, removedLines) {
    // Check if this line is similar to any removed line
    for (const removedLine of removedLines) {
      if (areSimilarLines(line, removedLine)) {
        return true
      }
    }

    return false
  }

  /**
   * Check if two lines are similar
   * @param {string} line1 - First line
   * @param {string} line2 - Second line
   * @returns {boolean} - Whether the lines are similar
   */
  function areSimilarLines(line1, line2) {
    if (!line1 || !line2) return false

    // Simple implementation - check if they share a significant portion of words
    const words1 = line1.split(/\s+/).filter((w) => w.length > 3)
    const words2 = line2.split(/\s+/).filter((w) => w.length > 3)

    if (words1.length === 0 || words2.length === 0) return false

    let matchCount = 0
    words1.forEach((word) => {
      if (words2.includes(word)) {
        matchCount++
      }
    })

    // If they share at least 50% of words, consider them similar
    return matchCount >= Math.min(words1.length, words2.length) * 0.5
  }

  /**
   * Set up suggestion handlers
   */
  function setupSuggestionHandlers() {
    // Will be set up when suggestions are rendered
  }

  /**
   * Update the UI with current state
   */
  function updateUI() {
    // Update score
    updateScoreDisplay()

    // Update suggestions
    updateSuggestions()

    // Update view mode
    updateViewMode()

    // Update keyword matches
    updateKeywordMatches()
  }

  /**
   * Update the score display
   */
  function updateScoreDisplay() {
    if (!editorState.analysisResults) return

    const scoreCircle = document.getElementById("scoreCircle")
    const scoreText = document.getElementById("scoreText")

    if (scoreCircle && scoreText) {
      const score = editorState.analysisResults.score
      scoreCircle.style.strokeDasharray = `${score}, 100`
      scoreText.textContent = `${score}%`
    }
  }

  /**
   * Update suggestions display
   */
  function updateSuggestions() {
    const suggestionsContainer = document.getElementById("improvementSuggestions")
    if (!suggestionsContainer) {
      debug.warn("Suggestions container not found")
      return
    }

    // Clear existing suggestions
    suggestionsContainer.innerHTML = ""

    // Add new suggestions
    editorState.suggestions.forEach((suggestion) => {
      const suggestionElement = document.createElement("div")
      suggestionElement.className = `suggestion-item suggestion-${suggestion.type}`
      suggestionElement.innerHTML = `
        <div class="suggestion-text">${sanitizeHTML(suggestion.text)}</div>
        <button class="suggestion-apply">Apply</button>
      `

      // Add event listener
      suggestionElement.querySelector(".suggestion-apply").addEventListener("click", () => {
        suggestion.action()
      })

      suggestionsContainer.appendChild(suggestionElement)
    })

    // Show/hide empty state
    const emptySuggestions = document.getElementById("emptySuggestions")
    if (emptySuggestions) {
      if (editorState.suggestions.length === 0) {
        emptySuggestions.classList.remove("hidden")
      } else {
        emptySuggestions.classList.add("hidden")
      }
    }
  }

  /**
   * Update keyword matches display
   */
  function updateKeywordMatches() {
    if (!editorState.analysisResults) return

    const matchingContainer = document.getElementById("matchingKeywords")
    const missingContainer = document.getElementById("missingKeywords")

    if (!matchingContainer || !missingContainer) {
      debug.warn("Keyword containers not found")
      return
    }

    // Update matching keywords
    matchingContainer.innerHTML = ""
    if (editorState.analysisResults.matchingKeywords && editorState.analysisResults.matchingKeywords.length > 0) {
      editorState.analysisResults.matchingKeywords.forEach((keyword) => {
        const keywordElement = document.createElement("div")
        keywordElement.className = "keyword-match"
        keywordElement.innerHTML = `
          <span class="keyword-text">${sanitizeHTML(keyword.text)}</span>
          <span class="keyword-frequency">${keyword.frequency}×</span>
        `
        matchingContainer.appendChild(keywordElement)
      })
    } else {
      matchingContainer.innerHTML = "<p class='empty-list'>No matching keywords found</p>"
    }

    // Update missing keywords
    missingContainer.innerHTML = ""
    if (editorState.analysisResults.missingKeywords && editorState.analysisResults.missingKeywords.length > 0) {
      editorState.analysisResults.missingKeywords.forEach((keyword) => {
        const keywordElement = document.createElement("div")
        keywordElement.className = "keyword-miss"
        keywordElement.innerHTML = `
          <span class="keyword-text">${sanitizeHTML(keyword)}</span>
          <button class="keyword-add" data-keyword="${sanitizeHTML(keyword)}">Add</button>
        `

        // Add event listener to add button
        keywordElement.querySelector(".keyword-add").addEventListener("click", () => {
          addKeywordToResume(keyword)
        })

        missingContainer.appendChild(keywordElement)
      })
    } else {
      missingContainer.innerHTML = "<p class='empty-list'>No missing keywords found</p>"
    }
  }

  /**
   * Show error message
   * @param {string} message - The error message
   */
  function showErrorMessage(message) {
    // Create error container if it doesn't exist
    let errorContainer = document.getElementById("errorContainer")
    if (!errorContainer) {
      errorContainer = document.createElement("div")
      errorContainer.id = "errorContainer"
      errorContainer.className = "error-message"

      // Find a good place to insert the error container
      const resultsArea = document.getElementById("resultsArea")
      if (resultsArea) {
        resultsArea.parentNode.insertBefore(errorContainer, resultsArea)
      } else {
        const analyzeButton = document.getElementById("analyzeButton")
        if (analyzeButton) {
          analyzeButton.parentNode.insertBefore(errorContainer, analyzeButton.nextSibling)
        }
      }
    }

    // Update error message
    errorContainer.innerHTML = `
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="error-content">
        <div class="error-title">Error</div>
        <div class="error-text">${sanitizeHTML(message)}</div>
      </div>
    `

    // Show error container
    errorContainer.classList.remove("hidden")
  }

  /**
   * Hide error message
   */
  function hideErrorMessage() {
    const errorContainer = document.getElementById("errorContainer")
    if (errorContainer) {
      errorContainer.classList.add("hidden")
    }
  }

  /**
   * Process resume file
   * @param {File} file - The resume file
   * @returns {Promise<string>} - The extracted text
   */
  async function processResumeFile(file) {
    if (!file) {
      throw new Error("No file provided")
    }

    // Check file size
    if (file.size > CONFIG.maxFileSize) {
      throw new Error(`File size exceeds the maximum limit of ${CONFIG.maxFileSize / (1024 * 1024)}MB`)
    }

    // Set processing state
    editorState.processingFile = true
    updateAnalysisStatus("Processing file...")

    try {
      // Detect file type
      const fileType = window.detectFileType ? window.detectFileType(file) : "unknown"
      debug.log("Detected file type:", fileType)

      let text = ""

      // Extract text based on file type
      switch (fileType) {
        case "pdf":
          if (typeof window.extractTextFromPDF === "function") {
            text = await window.extractTextFromPDF(file)
          } else {
            throw new Error("PDF extraction function not available")
          }
          break
        case "docx":
          if (typeof window.extractTextFromDOCX === "function") {
            text = await window.extractTextFromDOCX(file)
          } else {
            throw new Error("DOCX extraction function not available")
          }
          break
        case "txt":
          text = await file.text()
          break
        default:
          // Try to extract text using any available method
          try {
            if (typeof window.extractTextFromAnyFile === "function") {
              text = await window.extractTextFromAnyFile(file)
            } else {
              text = await file.text()
            }
          } catch (error) {
            throw new Error(`Unsupported file type: ${file.type || "unknown"}`)
          }
      }

      // Validate extracted text
      if (!text || text.trim().length < 50) {
        throw new Error("Could not extract sufficient text from the file")
      }

      // Normalize text encoding
      text = normalizeText(text)

      return text
    } catch (error) {
      debug.error("Error processing resume file:", error)
      throw error
    } finally {
      // Reset processing state
      editorState.processingFile = false
      updateAnalysisStatus("")
    }
  }

  // Expose functions to global scope
  window.ResumeEditor = {
    init: initResumeEditor,
    analyze: analyzeResume,
    processFile: processResumeFile,
    getState: () => ({
      ...editorState,
      addKeywordToResume, // Include the function for external access
    }),
    showError: showErrorMessage,
    hideError: hideErrorMessage,
  }
})()
/**
 * Resume Editor - Main functionality
 * This script handles the core resume editing and optimization features
 */

// Global variables
let resumeText = ""
let originalResumeText = ""
let currentScore = 0
let currentKeywords = []
let currentSuggestions = []

// Initialize the editor when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Resume Editor initializing...")
  initializeEditor()
})

// Set up the editor and event listeners
function initializeEditor() {
  // Get DOM elements
  const resumeUpload = document.getElementById("resumeUpload")
  const jobDescriptionInput = document.getElementById("jobDescriptionInput")
  const applyChangesBtn = document.getElementById("applyChangesBtn")
  const compareBtn = document.getElementById("compareBtn")
  const resumeEditor = document.getElementById("resumeEditor")

  // Check if required elements exist
  if (!resumeUpload || !jobDescriptionInput) {
    console.error("Required DOM elements not found. Editor initialization failed.")
    return
  }

  // Set up file upload handler
  resumeUpload.addEventListener("change", (event) => {
    const file = event.target.files[0]
    if (file) {
      processResumeFile(file)
    }
  })

  // Set up job description input handler
  jobDescriptionInput.addEventListener(
    "input",
    debounce(function () {
      if (resumeText) {
        updateAnalysis(resumeText, this.value)
      }
    }, 500),
  )

  // Set up apply changes button
  if (applyChangesBtn) {
    applyChangesBtn.addEventListener("click", () => {
      applySuggestions()
    })
  }

  // Set up compare button
  if (compareBtn) {
    compareBtn.addEventListener("click", () => {
      showComparison()
    })
  }

  // Make resume editor editable if it exists
  if (resumeEditor) {
    if (resumeEditor.tagName === "DIV") {
      resumeEditor.contentEditable = "true"
      resumeEditor.addEventListener("input", function () {
        resumeText = this.textContent
        const jobDescription = jobDescriptionInput.value
        if (jobDescription) {
          updateAnalysis(resumeText, jobDescription)
        }
      })
    } else if (resumeEditor.tagName === "TEXTAREA") {
      resumeEditor.addEventListener("input", function () {
        resumeText = this.value
        const jobDescription = jobDescriptionInput.value
        if (jobDescription) {
          updateAnalysis(resumeText, jobDescription)
        }
      })
    }
  }

  console.log("Resume Editor initialized successfully")
}

// Process the uploaded resume file
function processResumeFile(file) {
  console.log("Processing resume file:", file.name)

  // Check file type
  const fileType = file.type || ""
  const fileName = file.name || ""
  const fileExtension = fileName.split(".").pop().toLowerCase()

  if (fileType.includes("pdf") || fileExtension === "pdf") {
    processPdfFile(file)
  } else if (fileType.includes("word") || ["doc", "docx"].includes(fileExtension)) {
    processWordFile(file)
  } else {
    // Default to text processing
    processTextFile(file)
  }
}

// Process PDF files
function processPdfFile(file) {
  console.log("Processing PDF file")

  // Check if PDF.js is available
  if (window.pdfjsLib) {
    const fileReader = new FileReader()

    fileReader.onload = function () {
      const typedArray = new Uint8Array(this.result)

      // Load the PDF document
      window.pdfjsLib
        .getDocument(typedArray)
        .promise.then((pdf) => {
          // Extract text from all pages
          const textPromises = []
          for (let i = 1; i <= pdf.numPages; i++) {
            textPromises.push(
              pdf
                .getPage(i)
                .then((page) =>
                  page.getTextContent().then((textContent) => textContent.items.map((item) => item.str).join(" ")),
                ),
            )
          }

          // Combine text from all pages
          Promise.all(textPromises).then((pageTexts) => {
            resumeText = pageTexts.join("\n\n")
            originalResumeText = resumeText

            // Update the editor
            updateEditorContent(resumeText)

            // Run analysis if job description is available
            const jobDescription = document.getElementById("jobDescriptionInput").value
            if (jobDescription) {
              updateAnalysis(resumeText, jobDescription)
            }
          })
        })
        .catch((error) => {
          console.error("Error processing PDF:", error)
          alert("Error processing PDF file. Please try a different file format.")
        })
    }

    fileReader.readAsArrayBuffer(file)
  } else {
    // Fallback to text processing if PDF.js is not available
    console.warn("PDF.js not available, falling back to text processing")
    processTextFile(file)
  }
}

// Process Word files
function processWordFile(file) {
  console.log("Processing Word file")

  // Check if mammoth.js is available
  if (window.mammoth) {
    const fileReader = new FileReader()

    fileReader.onload = function () {
      window.mammoth
        .extractRawText({ arrayBuffer: this.result })
        .then((result) => {
          resumeText = result.value
          originalResumeText = resumeText

          // Update the editor
          updateEditorContent(resumeText)

          // Run analysis if job description is available
          const jobDescription = document.getElementById("jobDescriptionInput").value
          if (jobDescription) {
            updateAnalysis(resumeText, jobDescription)
          }
        })
        .catch((error) => {
          console.error("Error processing Word document:", error)
          alert("Error processing Word file. Please try a different file format.")
        })
    }

    fileReader.readAsArrayBuffer(file)
  } else {
    // Fallback to text processing if mammoth.js is not available
    console.warn("mammoth.js not available, falling back to text processing")
    processTextFile(file)
  }
}

// Process text files
function processTextFile(file) {
  console.log("Processing text file")

  const fileReader = new FileReader()

  fileReader.onload = function () {
    resumeText = this.result
    originalResumeText = resumeText

    // Update the editor
    updateEditorContent(resumeText)

    // Run analysis if job description is available
    const jobDescription = document.getElementById("jobDescriptionInput").value
    if (jobDescription) {
      updateAnalysis(resumeText, jobDescription)
    }
  }

  fileReader.readAsText(file)
}

// Update the editor content with the resume text
function updateEditorContent(text) {
  const resumeEditor = document.getElementById("resumeEditor")

  if (resumeEditor) {
    if (resumeEditor.tagName === "TEXTAREA") {
      resumeEditor.value = text
    } else {
      resumeEditor.textContent = text
    }
  }
}

// Update the analysis based on resume and job description
function updateAnalysis(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) {
    console.warn("Missing resume text or job description for analysis")
    return
  }

  console.log("Updating analysis")

  // Extract keywords from job description
  currentKeywords = extractKeywords(jobDescription)

  // Calculate match score
  currentScore = calculateScore(resumeText, jobDescription, currentKeywords)

  // Generate suggestions
  currentSuggestions = generateSuggestions(resumeText, jobDescription, currentKeywords)

  // Update UI
  updateUI(currentScore, currentKeywords, currentSuggestions)
}

// Extract keywords from job description
function extractKeywords(text) {
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

// Calculate match score between resume and job description
function calculateScore(resumeText, jobDescription, keywords) {
  if (!resumeText || !keywords || !keywords.length) {
    return 0
  }

  let matchCount = 0
  const totalKeywords = keywords.length

  // Count matching keywords
  keywords.forEach((keyword) => {
    if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      matchCount++
    }
  })

  // Calculate basic score based on keyword matches
  let score = Math.round((matchCount / totalKeywords) * 100)

  // Adjust score based on resume length (penalize very short resumes)
  if (resumeText.length < 500) {
    score = Math.max(0, score - 20)
  }

  return score
}

// Generate suggestions for improving the resume
function generateSuggestions(resumeText, jobDescription, keywords) {
  const suggestions = []

  // Check for missing keywords
  const missingKeywords = []
  keywords.forEach((keyword) => {
    if (!resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      missingKeywords.push(keyword)
    }
  })

  if (missingKeywords.length > 0) {
    suggestions.push(`Consider adding these keywords: ${missingKeywords.join(", ")}`)
  }

  // Check resume length
  if (resumeText.length < 1000) {
    suggestions.push("Your resume seems short. Consider adding more details about your experience.")
  }

  // Check for contact information
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const phoneRegex = /\b(\+\d{1,2}\s)?$$?\d{3}$$?[\s.-]?\d{3}[\s.-]?\d{4}\b/

  if (!emailRegex.test(resumeText)) {
    suggestions.push("Add your email address for contact information.")
  }

  if (!phoneRegex.test(resumeText)) {
    suggestions.push("Add your phone number for contact information.")
  }

  // Check for education section
  const educationKeywords = ["education", "degree", "university", "college", "bachelor", "master", "phd"]
  const hasEducation = educationKeywords.some((keyword) => resumeText.toLowerCase().includes(keyword.toLowerCase()))

  if (!hasEducation) {
    suggestions.push("Consider adding an education section to your resume.")
  }

  // Check for experience section
  const experienceKeywords = ["experience", "work", "job", "position", "role"]
  const hasExperience = experienceKeywords.some((keyword) => resumeText.toLowerCase().includes(keyword.toLowerCase()))

  if (!hasExperience) {
    suggestions.push("Consider adding work experience details to your resume.")
  }

  return suggestions
}

// Update the UI with analysis results
function updateUI(score, keywords, suggestions) {
  // Update score display
  const scoreDisplay = document.getElementById("scoreDisplay")
  if (scoreDisplay) {
    scoreDisplay.textContent = `Match Score: ${score}%`

    // Add visual indicator of score
    if (score < 40) {
      scoreDisplay.className = "score-low"
    } else if (score < 70) {
      scoreDisplay.className = "score-medium"
    } else {
      scoreDisplay.className = "score-high"
    }
  }

  // Update keywords list
  const keywordsList = document.getElementById("keywordsList")
  if (keywordsList) {
    keywordsList.innerHTML = ""

    if (keywords.length === 0) {
      const li = document.createElement("li")
      li.textContent = "No keywords found"
      keywordsList.appendChild(li)
    } else {
      keywords.forEach((keyword) => {
        const li = document.createElement("li")
        li.textContent = keyword

        // Highlight keywords that are in the resume
        if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
          li.className = "keyword-match"
        } else {
          li.className = "keyword-missing"
        }

        keywordsList.appendChild(li)
      })
    }
  }

  // Update suggestions list
  const suggestionsList = document.getElementById("suggestionsList")
  if (suggestionsList) {
    suggestionsList.innerHTML = ""

    if (suggestions.length === 0) {
      const li = document.createElement("li")
      li.textContent = "No suggestions available"
      suggestionsList.appendChild(li)
    } else {
      suggestions.forEach((suggestion) => {
        const li = document.createElement("li")
        li.textContent = suggestion
        suggestionsList.appendChild(li)
      })
    }
  }
}

// Apply suggestions to the resume
function applySuggestions() {
  console.log("Applying suggestions")

  // Store original resume for comparison if not already stored
  originalResumeText = originalResumeText || resumeText

  // Get missing keywords
  const jobDescription = document.getElementById("jobDescriptionInput").value
  const keywords = extractKeywords(jobDescription)

  const missingKeywords = []
  keywords.forEach((keyword) => {
    if (!resumeText.toLowerCase().includes(keyword.toLowerCase())) {
      missingKeywords.push(keyword)
    }
  })

  if (missingKeywords.length > 0) {
    // Add missing keywords to the resume
    const keywordSection = `\n\nAdditional Skills: ${missingKeywords.join(", ")}`
    resumeText += keywordSection

    // Update the editor with the new text
    updateEditorContent(resumeText)

    // Re-run analysis
    updateAnalysis(resumeText, jobDescription)

    // Show success message
    alert("Suggestions applied successfully!")
  } else {
    alert("No missing keywords to add.")
  }
}

// Show comparison between original and current resume
function showComparison() {
  console.log("Showing comparison")

  if (!originalResumeText || originalResumeText === resumeText) {
    alert("No changes to compare. Please apply suggestions first.")
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
    updatedColumn.id = "updatedResumeContent"
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
  document.getElementById("originalResumeContent").textContent = originalResumeText
  document.getElementById("updatedResumeContent").textContent = resumeText

  // Show the modal
  comparisonModal.style.display = "block"
}

// Utility function to debounce frequent events
function debounce(func, wait) {
  let timeout
  return function () {
    const args = arguments
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

// Make functions available globally
window.processResumeFile = processResumeFile
window.updateAnalysis = updateAnalysis
window.extractKeywords = extractKeywords
window.calculateScore = calculateScore
window.generateSuggestions = generateSuggestions
window.updateUI = updateUI
window.applySuggestions = applySuggestions
window.showComparison = showComparison
