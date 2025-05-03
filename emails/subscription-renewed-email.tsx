import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from "@react-email/components"

interface SubscriptionRenewedEmailProps {
  name: string
  plan: string
  nextBillingDate: string
}

export const SubscriptionRenewedEmail = ({ name, plan, nextBillingDate }: SubscriptionRenewedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Resume Optimizer Subscription Has Been Renewed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXTAUTH_URL}/logo.png`}
            width="120"
            height="40"
            alt="Resume Optimizer"
            style={logo}
          />
          <Heading style={heading}>Subscription Renewed</Heading>
          <Section style={section}>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>Your Resume Optimizer {plan} Plan subscription has been successfully renewed.</Text>
            <Text style={text}>
              You will continue to enjoy all the benefits of the {plan} Plan for another billing cycle.
            </Text>
            <Text style={text}>Your next billing date will be on {nextBillingDate}.</Text>
            <Text style={text}>You can manage your subscription at any time from your account settings.</Text>
            <Link href={`${process.env.NEXTAUTH_URL}/dashboard/account`} style={button}>
              Manage Subscription
            </Link>
            <Text style={text}>
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </Text>
            <Text style={text}>Thank you for your continued support!</Text>
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
