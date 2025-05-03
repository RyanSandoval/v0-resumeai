import fetch from "node-fetch"

async function main() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXTAUTH_URL || "http://localhost:3000"

  console.log(`Verifying deployment at ${baseUrl}...`)

  try {
    // Check health endpoint
    console.log("Checking health endpoint...")
    const healthRes = await fetch(`${baseUrl}/api/health`)
    const healthData = await healthRes.json()
    console.log("Health check response:", healthData)

    // Check database connection
    console.log("Checking database connection...")
    const dbRes = await fetch(`${baseUrl}/api/db-test`)
    const dbData = await dbRes.json()
    console.log("Database check response:", dbData)

    // Check if NextAuth endpoints are accessible
    console.log("Checking NextAuth endpoints...")
    const authRes = await fetch(`${baseUrl}/api/auth/providers`)
    const authStatus = authRes.status
    console.log(`NextAuth providers endpoint status: ${authStatus}`)

    if (authStatus !== 200) {
      console.error("NextAuth endpoints are not accessible!")
    } else {
      console.log("NextAuth endpoints are accessible")
    }

    console.log("Deployment verification completed")
  } catch (error) {
    console.error("Deployment verification failed:", error)
    process.exit(1)
  }
}

main()
