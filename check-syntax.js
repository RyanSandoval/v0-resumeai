const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach((file) => {
    const dirFile = path.join(dir, file)
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile)
    } catch (err) {
      console.log(`Error reading file ${dirFile}: ${err.message}`)
    }
  })
  return filelist
}

// Find all JavaScript files
const jsFiles = walkSync(".").filter(
  (file) => file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".ts") || file.endsWith(".tsx"),
)

console.log("Checking syntax of JavaScript files...")
jsFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8")

    // Check for unquoted attributes
    const unquotedNameAttr = /name\s*=\s*[^"'][^>\s]*/g
    const matches = content.match(unquotedNameAttr)

    if (matches) {
      console.log(`Found unquoted name attribute in ${file}:`)
      matches.forEach((match) => console.log(`  ${match}`))
    } else {
      console.log(`No unquoted name attributes found in ${file}`)
    }

    // Check for unclosed tags
    const unclosedTags = /<[a-zA-Z][^>]*[^/]>(?![^<]*<\/)/g
    const unclosedMatches = content.match(unclosedTags)

    if (unclosedMatches) {
      console.log(`Found potentially unclosed tags in ${file}:`)
      unclosedMatches.forEach((match) => console.log(`  ${match}`))
    } else {
      console.log(`No unclosed tags found in ${file}`)
    }
  } catch (err) {
    console.log(`Error checking syntax in ${file}: ${err.message}`)
  }
})

console.log("Syntax check completed")
