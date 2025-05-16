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
  }

  /**
   * Initialize the resume editor
   * @param {string} resumeText - The initial resume text
   * @param {Object} initialAnalysis - Initial analysis results
   */
  function initResumeEditor(resumeText, initialAnalysis) {
    // Store initial state
    editorState.originalText = resumeText
    editorState.currentText = resumeText
    editorState.analysisResults = initialAnalysis

    // Set up the editor
    setupEditor()

    // Set up view mode toggles
    setupViewModeToggles()

    // Set up suggestion handling
    setupSuggestionHandlers()

    // Generate initial suggestions
    generateSuggestions(initialAnalysis)

    // Update UI with initial state
    updateUI()
  }

  /**
   * Set up the resume editor
   */
  function setupEditor() {
    const editor = document.getElementById("resumeEditor")
    if (!editor) return

    // Set initial content
    editor.value = editorState.currentText

    // Add event listeners
    editor.addEventListener("input", handleEditorInput)

    // Add auto-save functionality
    editor.addEventListener("blur", saveChanges)

    // Set up keyboard shortcuts
    editor.addEventListener("keydown", handleKeyboardShortcuts)
  }

  /**
   * Handle input in the editor
   * @param {Event} event - The input event
   */
  function handleEditorInput(event) {
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
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} event - The keyboard event
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
      const jobDescription = document.getElementById("jobDescription").value

      // Get additional keywords
      const additionalKeywords = getAdditionalKeywords()

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
    } catch (error) {
      console.error("Error analyzing resume:", error)
      updateAnalysisStatus("Analysis failed")
    } finally {
      // Reset analyzing state
      editorState.isAnalyzing = false
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

    return sections.filter((section) => {
      const regex = new RegExp(`\\b${section}\\b`, "i")
      return !regex.test(text) || text.match(regex).length < 2
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

    let count = 0
    strongVerbs.forEach((verb) => {
      const regex = new RegExp(`\\b${verb}\\b`, "i")
      if (regex.test(text)) {
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
    return text.includes("•") || (text.includes("-") && text.match(/\n[-•]/g))
  }

  /**
   * Add a keyword to the resume
   * @param {string} keyword - The keyword to add
   */
  function addKeywordToResume(keyword) {
    // Find appropriate section to add keyword
    const section = findBestSectionForKeyword(keyword)

    // Get editor
    const editor = document.getElementById("resumeEditor")
    if (!editor) return

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
    // Create modal dialog
    const dialog = document.createElement("div")
    dialog.className = "keyword-selection-dialog"
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Select a keyword to add</h3>
        <p>Choose the most relevant keyword for your resume:</p>
        <div class="keyword-options">
          ${keywords
            .map((keyword) => `<button class="keyword-option" data-keyword="${keyword}">${keyword}</button>`)
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
        navigator.clipboard.writeText(verb.textContent)
        verb.classList.add("copied")
        setTimeout(() => verb.classList.remove("copied"), 1000)
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
    if (!toggles.length) return

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

    if (!editorContainer || !editor || !comparison) return

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

    // Escape HTML
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")

    // Convert newlines to <br>
    html = html.replace(/\n/g, "<br>")

    return html
  }

  /**
   * Generate diff view comparing original and current text
   * @param {string} original - The original text
   * @param {string} current - The current text
   * @returns {string} - HTML with highlighted differences
   */
  function generateDiffView(original, current) {
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
    // Simple implementation - check if they share a significant portion of words
    const words1 = line1.split(/\s+/).filter((w) => w.length > 3)
    const words2 = line2.split(/\s+/).filter((w) => w.length > 3)

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
    if (!suggestionsContainer) return

    // Clear existing suggestions
    suggestionsContainer.innerHTML = ""

    // Add new suggestions
    editorState.suggestions.forEach((suggestion) => {
      const suggestionElement = document.createElement("div")
      suggestionElement.className = `suggestion-item suggestion-${suggestion.type}`
      suggestionElement.innerHTML = `
        <div class="suggestion-text">${suggestion.text}</div>
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

    if (!matchingContainer || !missingContainer) return

    // Update matching keywords
    matchingContainer.innerHTML = ""
    editorState.analysisResults.matchingKeywords.forEach((keyword) => {
      const keywordElement = document.createElement("div")
      keywordElement.className = "keyword-match"
      keywordElement.innerHTML = `
        <span class="keyword-text">${keyword.text}</span>
        <span class="keyword-frequency">${keyword.frequency}×</span>
      `
      matchingContainer.appendChild(keywordElement)
    })

    // Update missing keywords
    missingContainer.innerHTML = ""
    editorState.analysisResults.missingKeywords.forEach((keyword) => {
      const keywordElement = document.createElement("div")
      keywordElement.className = "keyword-miss"
      keywordElement.innerHTML = `
        <span class="keyword-text">${keyword}</span>
        <button class="keyword-add" data-keyword="${keyword}">Add</button>
      `

      // Add event listener
      keywordElement.querySelector(".keyword-add").addEventListener("click", () => {
        addKeywordToResume(keyword)
      })

      missingContainer.appendChild(keywordElement)
    })
  }

  // Expose functions to global scope
  window.ResumeEditor = {
    init: initResumeEditor,
    analyze: analyzeResume,
    getState: () => ({ ...editorState }),
  }
})()
