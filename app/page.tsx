import Header from "../components/header"
import Footer from "../components/footer"
import Button from "../components/button"

export default function Home() {
  return (
    <div style={{ padding: "20px" }}>
      <Header />
      <main>
        <h2>Welcome to the Resume Optimizer</h2>
        <p>A tool to help you optimize your resume for job applications.</p>
        <div style={{ marginTop: "20px" }}>
          <Button>Get Started</Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
