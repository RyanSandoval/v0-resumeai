import { execSync } from "child_process"
import fs from "fs"
import path from "path"

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
}

console.log(`${colors.cyan}=== DEPLOYMENT DIAGNOSTICS ====${colors.reset}\n`)

// Check Node.js version
try {
  const nodeVersion = process.version
  console.log(`${colors.blue}Node.js version:${colors.reset} ${nodeVersion}`)

  // Warn if Node.js version is not compatible with Next.js
  const versionNumber = Number(nodeVersion.slice(1).split(".")[0])
  if (versionNumber < 16) {
    console.log(
      `${colors.red}WARNING: Node.js version ${nodeVersion} may not be compatible with Next.js 14.${colors.reset}`,
    )
  } else {
    console.log(`${colors.green}✓ Node.js version is compatible${colors.reset}`)
  }
} catch (error) {
  console.error(`${colors.red}Failed to check Node.js version:${colors.reset}`, error)
}

// Check for required environment variables
console.log(`\n${colors.blue}Checking environment variables:${colors.reset}`)
const requiredEnvVars = ["NEXTAUTH_URL", "NEXTAUTH_SECRET", "DATABASE_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])
if (missingEnvVars.length > 0) {
  console.log(`${colors.red}Missing required environment variables:${colors.reset}`)
  missingEnvVars.forEach((envVar) => {
    console.log(`  - ${envVar}`)
  })
} else {
  console.log(`${colors.green}✓ All required environment variables are set${colors.reset}`)
}

// Check package.json for required dependencies
console.log(`\n${colors.blue}Checking package.json:${colors.reset}`)
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"))

  // Check for required dependencies
  const requiredDeps = ["next", "react", "react-dom", "next-auth", "@prisma/client"]

  const missingDeps = requiredDeps.filter((dep) => !packageJson.dependencies[dep])
  if (missingDeps.length > 0) {
    console.log(`${colors.red}Missing required dependencies:${colors.reset}`)
    missingDeps.forEach((dep) => {
      console.log(`  - ${dep}`)
    })
  } else {
    console.log(`${colors.green}✓ All required dependencies are present${colors.reset}`)
  }

  // Check for build script
  if (!packageJson.scripts.build) {
    console.log(`${colors.red}Missing build script in package.json${colors.reset}`)
  } else {
    console.log(`${colors.green}✓ Build script is present: ${colors.reset}${packageJson.scripts.build}`)
  }
} catch (error) {
  console.error(`${colors.red}Failed to check package.json:${colors.reset}`, error)
}

// Check for TypeScript errors
console.log(`\n${colors.blue}Checking for TypeScript errors:${colors.reset}`)
try {
  execSync("npx tsc --noEmit", { stdio: "pipe" })
  console.log(`${colors.green}✓ No TypeScript errors found${colors.reset}`)
} catch (error) {
  console.log(`${colors.red}TypeScript errors found:${colors.reset}`)
  console.log(error.stdout.toString())
}

// Check for Prisma schema
console.log(`\n${colors.blue}Checking Prisma schema:${colors.reset}`)
try {
  if (fs.existsSync(path.join(process.cwd(), "prisma", "schema.prisma"))) {
    console.log(`${colors.green}✓ Prisma schema found${colors.reset}`)

    // Check if Prisma client is generated
    if (fs.existsSync(path.join(process.cwd(), "node_modules", ".prisma", "client"))) {
      console.log(`${colors.green}✓ Prisma client is generated${colors.reset}`)
    } else {
      console.log(`${colors.yellow}! Prisma client is not generated. Run 'npx prisma generate'${colors.reset}`)
    }
  } else {
    console.log(`${colors.red}Prisma schema not found${colors.reset}`)
  }
} catch (error) {
  console.error(`${colors.red}Failed to check Prisma schema:${colors.reset}`, error)
}

// Check for Next.js configuration
console.log(`\n${colors.blue}Checking Next.js configuration:${colors.reset}`)
try {
  if (
    fs.existsSync(path.join(process.cwd(), "next.config.js")) ||
    fs.existsSync(path.join(process.cwd(), "next.config.mjs"))
  ) {
    console.log(`${colors.green}✓ Next.js configuration found${colors.reset}`)

    // Read and display the configuration
    const configPath = fs.existsSync(path.join(process.cwd(), "next.config.js"))
      ? path.join(process.cwd(), "next.config.js")
      : path.join(process.cwd(), "next.config.mjs")

    const configContent = fs.readFileSync(configPath, "utf8")
    console.log(`${colors.cyan}Next.js configuration:${colors.reset}`)
    console.log(configContent)
  } else {
    console.log(`${colors.yellow}! Next.js configuration not found${colors.reset}`)
  }
} catch (error) {
  console.error(`${colors.red}Failed to check Next.js configuration:${colors.reset}`, error)
}

// Check for Vercel configuration
console.log(`\n${colors.blue}Checking Vercel configuration:${colors.reset}`)
try {
  if (fs.existsSync(path.join(process.cwd(), "vercel.json"))) {
    console.log(`${colors.green}✓ Vercel configuration found${colors.reset}`)

    // Read and display the configuration
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"))
    console.log(`${colors.cyan}Vercel configuration:${colors.reset}`)
    console.log(JSON.stringify(vercelConfig, null, 2))
  } else {
    console.log(`${colors.yellow}! Vercel configuration not found${colors.reset}`)
  }
} catch (error) {
  console.error(`${colors.red}Failed to check Vercel configuration:${colors.reset}`, error)
}

console.log(`\n${colors.cyan}=== DIAGNOSTICS COMPLETE ====${colors.reset}`)
