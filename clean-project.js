const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Delete node_modules
console.log("Deleting node_modules...")
try {
  fs.rmSync("node_modules", { recursive: true, force: true })
  console.log("node_modules deleted successfully")
} catch (err) {
  console.log(`Error deleting node_modules: ${err.message}`)
}

// Delete .next directory
console.log("Deleting .next directory...")
try {
  fs.rmSync(".next", { recursive: true, force: true })
  console.log(".next directory deleted successfully")
} catch (err) {
  console.log(`Error deleting .next directory: ${err.message}`)
}

// Delete build directory
console.log("Deleting build directory...")
try {
  fs.rmSync("build", { recursive: true, force: true })
  console.log("build directory deleted successfully")
} catch (err) {
  console.log(`Error deleting build directory: ${err.message}`)
}

// Delete out directory
console.log("Deleting out directory...")
try {
  fs.rmSync("out", { recursive: true, force: true })
  console.log("out directory deleted successfully")
} catch (err) {
  console.log(`Error deleting out directory: ${err.message}`)
}

// Delete package-lock.json
console.log("Deleting package-lock.json...")
try {
  fs.unlinkSync("package-lock.json")
  console.log("package-lock.json deleted successfully")
} catch (err) {
  console.log(`Error deleting package-lock.json: ${err.message}`)
}

// Install dependencies
console.log("Installing dependencies...")
try {
  execSync("npm install", { stdio: "inherit" })
  console.log("Dependencies installed successfully")
} catch (err) {
  console.log(`Error installing dependencies: ${err.message}`)
}

console.log("Project cleaned successfully")
