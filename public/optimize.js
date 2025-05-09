document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const resumeUploadArea = document.getElementById("resumeUploadArea")
  const resumeFile = document.getElementById("resumeFile")
  const resumeFileInfo = document.getElementById("resumeFileInfo")
  const resumeFileName = document.getElementById("resumeFileName")
  const removeResumeFile = document.getElementById("removeResumeFile")
  const jobDescription = document.getElementById("jobDescription")
  const keywordInput = document.getElementById("keywordInput")
  const keywordsList = document.getElementById("keywordsList")
  const analyzeButton = document.getElementById("analyzeButton")
  const resultsArea = document.getElementById("resultsArea")
  const initialMessage = document.getElementById("initialMessage")
  const keywordAnalysis = document.getElementById("keywordAnalysis")
  const suggestionsList = document.getElementById("suggestionsList")
  const resumePreview = document.getElementById("resumePreview")
  const scoreCircle = document.getElementById("scoreCircle")
  const scoreText = document.getElementById("scoreText")

  // Variables
  let resumeContent = ""
  let keywords = []

  // File Upload Handling
  resumeUploadArea.addEventListener("click", () => {
    resumeFile.click()
  })

  resumeFile.addEventListener("change", handleFileUpload)

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
      resumeFile.files = e.dataTransfer.files
      handleFileUpload()
    }
  })

  removeResumeFile.addEventListener("click", () => {
    resumeFile.value = ""
    resumeContent = ""
    resumeUploadArea.classList.remove("hidden")
    resumeFileInfo.classList.add("hidden")
  })

  // Keywords Handling
  keywordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && keywordInput.value.trim()) {
      e.preventDefault()
      addKeyword(keywordInput.value.trim())
      keywordInput.value = ""
    }
  })

  // Analyze Button
  analyzeButton.addEventListener("click", analyzeResume)

  // Functions
  function handleFileUpload() {
    if (resumeFile.files.length) {
      const file = resumeFile.files[0]
      resumeFileName.textContent = file.name
      resumeUploadArea.classList.add("hidden")
      resumeFileInfo.classList.remove("hidden")

      // Read file content
      const reader = new FileReader()
      reader.onload = (e) => {
        resumeContent = e.target.result
      }

      if (file.type === "application/pdf") {
        // For demo purposes, we'll just use a placeholder for PDF content
        resumeContent =
          "This is a simulated resume content from a PDF file.\n\nJohn Doe\njohndoe@example.com\n(123) 456-7890\n\nExperience:\n- Software Engineer at Tech Company (2018-Present)\n- Web Developer at Startup (2015-2018)\n\nSkills:\n- JavaScript, React, Node.js\n- HTML, CSS, Responsive Design\n- Problem Solving, Team Collaboration"
      } else {
        reader.readAsText(file)
      }
    }
  }

  function addKeyword(keyword) {
    if (keywords.includes(keyword)) return

    keywords.push(keyword)

    const keywordTag = document.createElement("div")
    keywordTag.className = "keyword-tag"
    keywordTag.innerHTML = `
      ${keyword}
      <span class="remove">&times;</span>
    `

    keywordTag.querySelector(".remove").addEventListener("click", () => {
      keywordsList.removeChild(keywordTag)
      keywords = keywords.filter((k) => k !== keyword)
    })

    keywordsList.appendChild(keywordTag)
  }

  function analyzeResume() {
    if (!resumeContent) {
      alert("Please upload a resume first.")
      return
    }

    if (!jobDescription.value.trim()) {
      alert("Please enter a job description.")
      return
    }

    // Show results area
    initialMessage.classList.add("hidden")
    resultsArea.classList.remove("hidden")

    // Extract keywords from job description if none provided
    if (keywords.length === 0) {
      const extractedKeywords = extractKeywords(jobDescription.value)
      extractedKeywords.forEach((keyword) => addKeyword(keyword))
    }

    // Calculate match score
    const matchScore = calculateMatchScore(resumeContent, jobDescription.value, keywords)
    updateScoreDisplay(matchScore)

    // Update keyword analysis
    updateKeywordAnalysis(resumeContent, keywords)

    // Generate suggestions
    generateSuggestions(resumeContent, jobDescription.value, keywords)

    // Display resume preview
    resumePreview.textContent = resumeContent
  }

  function extractKeywords(jobDesc) {
    // This is a simplified keyword extraction
    // In a real application, this would be more sophisticated
    const commonWords = ["and", "the", "a", "an", "in", "on", "at", "to", "for", "with", "by", "of", "is", "are"]
    const words = jobDesc.toLowerCase().match(/\b\w+\b/g) || []

    // Count word frequency
    const wordCount = {}
    words.forEach((word) => {
      if (!commonWords.includes(word) && word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1
      }
    })

    // Get top keywords
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((entry) => entry[0])
  }

  function calculateMatchScore(resume, jobDesc, keywords) {
    // This is a simplified scoring algorithm
    // In a real application, this would be more sophisticated
    let score = 0
    const resumeLower = resume.toLowerCase()

    // Check for keyword matches
    keywords.forEach((keyword) => {
      if (resumeLower.includes(keyword.toLowerCase())) {
        score += 10
      }
    })

    // Check for education level match
    if (jobDesc.toLowerCase().includes("bachelor") && resumeLower.includes("bachelor")) {
      score += 15
    }

    // Check for experience match
    if (jobDesc.toLowerCase().includes("year") && resumeLower.includes("year")) {
      score += 15
    }

    // Limit score to 100
    return Math.min(score, 100)
  }

  function updateScoreDisplay(score) {
    scoreCircle.setAttribute("stroke-dasharray", `${score}, 100`)
    scoreText.textContent = `${score}%`

    // Change color based on score
    if (score < 50) {
      scoreCircle.setAttribute("stroke", "#f44336")
      scoreText.setAttribute("fill", "#f44336")
    } else if (score < 75) {
      scoreCircle.setAttribute("stroke", "#ff9800")
      scoreText.setAttribute("fill", "#ff9800")
    } else {
      scoreCircle.setAttribute("stroke", "#4caf50")
      scoreText.setAttribute("fill", "#4caf50")
    }
  }

  function updateKeywordAnalysis(resume, keywords) {
    keywordAnalysis.innerHTML = ""
    const resumeLower = resume.toLowerCase()

    keywords.forEach((keyword) => {
      const found = resumeLower.includes(keyword.toLowerCase())
      const keywordItem = document.createElement("div")
      keywordItem.className = "keyword-item"
      keywordItem.innerHTML = `
        <div class="keyword-status ${found ? "found" : "missing"}"></div>
        <div class="keyword-text ${!found ? "missing" : ""}">${keyword} ${!found ? "(missing)" : ""}</div>
      `
      keywordAnalysis.appendChild(keywordItem)
    })
  }

  function generateSuggestions(resume, jobDesc, keywords) {
    suggestionsList.innerHTML = ""
    const resumeLower = resume.toLowerCase()
    const suggestions = []

    // Check for missing keywords
    const missingKeywords = keywords.filter((keyword) => !resumeLower.includes(keyword.toLowerCase()))
    if (missingKeywords.length > 0) {
      suggestions.push(`Add the following keywords to your resume: ${missingKeywords.join(", ")}`)
    }

    // Check for contact information
    if (!resumeLower.includes("@") || !resumeLower.match(/\d{3}[-\s]?\d{3}[-\s]?\d{4}/)) {
      suggestions.push("Ensure your resume includes complete contact information (email and phone number)")
    }

    // Check for resume length
    const wordCount = resume.match(/\b\w+\b/g).length
    if (wordCount < 300) {
      suggestions.push("Your resume seems short. Consider adding more details about your experience and skills")
    } else if (wordCount > 700) {
      suggestions.push("Your resume is quite long. Consider condensing it to focus on the most relevant information")
    }

    // Check for action verbs
    const actionVerbs = ["managed", "developed", "created", "implemented", "designed", "led", "coordinated", "achieved"]
    const hasActionVerbs = actionVerbs.some((verb) => resumeLower.includes(verb))
    if (!hasActionVerbs) {
      suggestions.push("Use strong action verbs to describe your achievements and responsibilities")
    }

    // Check for quantifiable achievements
    const hasNumbers = resume.match(/\d+%|\d+ percent|\d+ years|\$\d+|\d+ people/i)
    if (!hasNumbers) {
      suggestions.push(
        'Include quantifiable achievements (e.g., "Increased sales by 20%", "Managed a team of 5 people")',
      )
    }

    // Add suggestions to the list
    suggestions.forEach((suggestion) => {
      const li = document.createElement("li")
      li.textContent = suggestion
      suggestionsList.appendChild(li)
    })

    // If no suggestions, add a positive message
    if (suggestions.length === 0) {
      const li = document.createElement("li")
      li.textContent = "Your resume looks good! No major issues were found."
      suggestionsList.appendChild(li)
    }
  }
})
