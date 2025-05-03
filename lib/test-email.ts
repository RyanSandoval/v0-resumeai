import { sendEmail, verifyEmailConnection } from "./email-service"

export async function sendTestEmail(to: string): Promise<boolean> {
  try {
    // First verify connection
    const isConnected = await verifyEmailConnection()
    if (!isConnected) {
      console.error("Failed to connect to email server")
      return false
    }

    // Send a test email
    await sendEmail({
      to,
      subject: "Resume Optimizer - Test Email",
      template: "subscription-welcome",
      data: {
        name: "Test User",
        plan: "Premium",
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      },
    })

    console.log(`✅ Test email sent to ${to}`)
    return true
  } catch (error) {
    console.error("Failed to send test email:", error)
    return false
  }
}
