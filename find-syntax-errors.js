const fs = require("fs")
const path = require("path")

// Function to recursively find all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
      }
    } else {
      arrayOfFiles.push(path.join(dirPath, file))
    }
  })

  return arrayOfFiles
}

// Function to check for potential JSX syntax errors
function checkForSyntaxErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8")

    // Check for common JSX syntax errors
    const missingClosingBracket = (content.match(/</g) || []).length !== (content.match(/>/g) || []).length
    const suspiciousNamedAttributes =
      content.includes("name=") && !content.includes('name="') && !content.includes("name='")

    if (missingClosingBracket || suspiciousNamedAttributes) {
      console.log(`Potential syntax error in ${filePath}`)

      if (missingClosingBracket) {
        console.log("  - Mismatched < and > brackets")
      }

      if (suspiciousNamedAttributes) {
        console.log('  - Suspicious "name=" attribute without quotes')

        // Find the line with the potential error
        const lines = content.split("\n")
        lines.forEach((line, index) => {
          if (line.includes("name=") && !line.includes('name="') && !line.includes("name='")) {
            console.log(`  - Line ${index + 1}: ${line.trim()}`)
          }
        })
      }
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`)
  }
}

// Get all files
const allFiles = getAllFiles(".")

// Check each file for potential syntax errors
console.log("Checking for potential syntax errors...")
allFiles.forEach((file) => {
  // Only check JavaScript and TypeScript files
  if (file.match(/\.(js|jsx|ts|tsx)$/)) {
    checkForSyntaxErrors(file)
  }
})

console.log("\nAll files in the project:")
allFiles.forEach((file) => console.log(file))
