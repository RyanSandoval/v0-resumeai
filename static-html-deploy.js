const { execSync } = require("child_process")

console.log("Deploying static HTML to Vercel...")
try {
  execSync("vercel --prod", { stdio: "inherit" })
  console.log("Static HTML deployed successfully to Vercel.")
} catch (err) {
  console.log(`Error deploying to Vercel: ${err.message}`)
}
