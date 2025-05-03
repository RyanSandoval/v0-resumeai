import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from "@react-email/components"

interface SubscriptionWelcomeEmailProps {
  name: string
  plan: string
  nextBillingDate: string
}

export const SubscriptionWelcomeEmail = ({ name, plan, nextBillingDate }: SubscriptionWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Resume Optimizer {plan} Plan!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXTAUTH_URL}/logo.png`}
            width="120"
            height="40"
            alt="Resume Optimizer"
            style={logo}
          />
          <Heading style={heading}>Welcome to Resume Optimizer {plan} Plan!</Heading>
          <Section style={section}>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Thank you for subscribing to the Resume Optimizer {plan} Plan! We're excited to help you create
              professional, job-winning resumes.
            </Text>
            <Text style={text}>Here's what you can expect with your {plan} Plan:</Text>
            {plan === "Basic" ? (
              <ul style={list}>
                <li style={listItem}>10 resume optimizations per month</li>
                <li style={listItem}>Access to all templates</li>
                <li style={listItem}>Advanced optimization</li>
                <li style={listItem}>Email support</li>
              </ul>
            ) : (
              <ul style={list}>
                <li style={listItem}>Unlimited optimizations</li>
                <li style={listItem}>Premium templates</li>
                <li style={listItem}>Priority support</li>
                <li style={listItem}>LinkedIn integration</li>
                <li style={listItem}>Cover letter assistance</li>
              </ul>
            )}
            <Text style={text}>Your next billing date will be on {nextBillingDate}.</Text>
            <Text style={text}>To get started, simply log in to your account and begin optimizing your resume.</Text>
            <Link href={`${process.env.NEXTAUTH_URL}/dashboard`} style={button}>
              Go to Dashboard
            </Link>
            <Text style={text}>
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </Text>
            <Text style={text}>Best regards,</Text>
            <Text style={text}>The Resume Optimizer Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "600px",
}

const logo = {
  margin: "0 auto",
  marginBottom: "20px",
}

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "800",
  color: "#484848",
  padding: "17px 0 0",
  textAlign: "center" as const,
}

const section = {
  padding: "0 20px",
}

const text = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
}

const list = {
  marginBottom: "10px",
}

const listItem = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
  marginBottom: "5px",
}

const button = {
  backgroundColor: "#5850ec",
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "20px 0",
  padding: "10px 20px",
  textDecoration: "none",
  textAlign: "center" as const,
}
