const { execSync } = require("child_process")

console.log("Building and exporting static site...")
try {
  // Build the Next.js app
  console.log("Building Next.js app...")
  execSync("npm run build", { stdio: "inherit" })

  // Export to static HTML
  console.log("Exporting to static HTML...")
  execSync("npm run export", { stdio: "inherit" })

  console.log('Static export completed successfully. Files are in the "out" directory.')
} catch (err) {
  console.log(`Error during static export: ${err.message}`)
}
