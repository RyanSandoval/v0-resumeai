const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Function to run commands and handle errors
function runCommand(command) {
  try {
    console.log(`Running: ${command}`)
    execSync(command, { stdio: "inherit" })
    return true
  } catch (error) {
    console.error(`Error executing: ${command}`)
    console.error(error.message)
    return false
  }
}

// Main build process
async function build() {
  console.log("Starting custom build process...")

  // Clean npm cache
  console.log("Cleaning npm cache...")
  runCommand("npm cache clean --force")

  // Try to install dependencies with different approaches
  console.log("Installing dependencies...")

  // Approach 1: Use npm install with legacy-peer-deps
  if (runCommand("npm install --legacy-peer-deps")) {
    console.log("Dependencies installed successfully with legacy-peer-deps!")
  }
  // Approach 2: Use npm install with force flag
  else if (runCommand("npm install --force")) {
    console.log("Dependencies installed successfully with force flag!")
  }
  // Approach 3: Use npm install with both flags
  else if (runCommand("npm install --legacy-peer-deps --force")) {
    console.log("Dependencies installed successfully with both flags!")
  }
  // Approach 4: Last resort - use a specific npm version
  else {
    console.log("Trying with a specific npm version...")
    runCommand("npm install -g npm@8.19.3")
    if (!runCommand("npm install --legacy-peer-deps")) {
      console.error("All installation approaches failed!")
      process.exit(1)
    }
  }

  // Generate Prisma client
  console.log("Generating Prisma client...")
  runCommand("npx prisma generate")

  // Run the build
  console.log("Building the application...")
  if (!runCommand("next build")) {
    console.error("Build failed!")
    process.exit(1)
  }

  console.log("Build completed successfully!")
}

// Run the build process
build().catch((error) => {
  console.error("Unhandled error in build process:", error)
  process.exit(1)
})
