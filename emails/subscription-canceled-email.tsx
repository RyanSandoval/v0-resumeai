import { Body, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from "@react-email/components"

interface SubscriptionCanceledEmailProps {
  name: string
  plan: string
  endDate: string
}

export const SubscriptionCanceledEmail = ({ name, plan, endDate }: SubscriptionCanceledEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Resume Optimizer Subscription Has Been Canceled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXTAUTH_URL}/logo.png`}
            width="120"
            height="40"
            alt="Resume Optimizer"
            style={logo}
          />
          <Heading style={heading}>Subscription Canceled</Heading>
          <Section style={section}>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              We're sorry to see you go. Your Resume Optimizer {plan} Plan subscription has been canceled.
            </Text>
            <Text style={text}>
              You will continue to have access to your {plan} Plan features until {endDate}.
            </Text>
            <Text style={text}>
              If you change your mind, you can resubscribe at any time from your account settings.
            </Text>
            <Link href={`${process.env.NEXTAUTH_URL}/pricing`} style={button}>
              Resubscribe
            </Link>
            <Text style={text}>
              We'd love to hear your feedback on why you decided to cancel. Please take a moment to let us know how we
              could improve.
            </Text>
            <Link href={`${process.env.NEXTAUTH_URL}/feedback`} style={feedbackButton}>
              Share Feedback
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

const feedbackButton = {
  backgroundColor: "#ffffff",
  borderRadius: "5px",
  border: "1px solid #5850ec",
  color: "#5850ec",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 20px",
  padding: "10px 20px",
  textDecoration: "none",
  textAlign: "center" as const,
}
