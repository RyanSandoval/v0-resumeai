import nodemailer from "nodemailer"
import { render } from "@react-email/render"
import { SubscriptionWelcomeEmail } from "@/emails/subscription-welcome-email"
import { PlanChangedEmail } from "@/emails/plan-changed-email"
import { SubscriptionRenewedEmail } from "@/emails/subscription-renewed-email"
import { SubscriptionCanceledEmail } from "@/emails/subscription-canceled-email"

type EmailOptions = {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

// Create a transporter using Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.EMAIL_SERVER_PORT || 587),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: false, // Brevo uses TLS, not SSL
  requireTLS: true, // Enforce TLS
})

// Send email function
export async function sendEmail({ to, subject, template, data }: EmailOptions): Promise<void> {
  try {
    // Select the appropriate email template
    let emailHtml: string

    switch (template) {
      case "subscription-welcome":
        emailHtml = render(
          <SubscriptionWelcomeEmail name={data.name} plan={data.plan} nextBillingDate={data.nextBillingDate} />,
        )
        break
      case "plan-changed":
        emailHtml = render(
          <PlanChangedEmail
            name={data.name}
            oldPlan={data.oldPlan}
            newPlan={data.newPlan}
            nextBillingDate={data.nextBillingDate}
          />,
        )
        break
      case "subscription-renewed":
        emailHtml = render(
          <SubscriptionRenewedEmail name={data.name} plan={data.plan} nextBillingDate={data.nextBillingDate} />,
        )
        break
      case "subscription-canceled":
        emailHtml = render(<SubscriptionCanceledEmail name={data.name} plan={data.plan} endDate={data.endDate} />)
        break
      default:
        throw new Error(`Email template "${template}" not found`)
    }

    // Add Brevo tracking pixel if needed
    const trackingPixel = process.env.ENABLE_EMAIL_TRACKING
      ? '<img src="https://track.brevo.com/open.php?u={tracking_hash}" width="1" height="1" alt="" />'
      : ""

    const htmlWithTracking = emailHtml + trackingPixel

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlWithTracking,
      headers: {
        "X-Mailer": "Resume Optimizer",
      },
    })

    console.log(`✅ Email sent to ${to} with template ${template}`)
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error)
    throw error
  }
}

// Verify connection function - useful for testing
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify()
    console.log("✅ Email server connection verified")
    return true
  } catch (error) {
    console.error("❌ Email server connection failed:", error)
    return false
  }
}
