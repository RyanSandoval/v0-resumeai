const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("Running pre-build checks...")

// Check if Prisma client needs to be generated
if (!fs.existsSync(path.join(process.cwd(), "node_modules", ".prisma", "client"))) {
  console.log("Generating Prisma client...")
  execSync("npx prisma generate", { stdio: "inherit" })
}

// Check for TypeScript errors
try {
  console.log("Checking for TypeScript errors...")
  execSync("npx tsc --noEmit", { stdio: "inherit" })
} catch (error) {
  console.error("TypeScript errors found. Fix them before deploying.")
  process.exit(1)
}

// Check for required environment variables
const requiredEnvVars = ["NEXTAUTH_URL", "NEXTAUTH_SECRET", "DATABASE_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])
if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:")
  missingEnvVars.forEach((envVar) => {
    console.error(`  - ${envVar}`)
  })
  process.exit(1)
}

console.log("Pre-build checks completed successfully.")
