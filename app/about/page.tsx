import Header from "../../components/header"
import Footer from "../../components/footer"

export default function About() {
  return (
    <div style={{ padding: "20px" }}>
      <Header />
      <main>
        <h2>About Resume Optimizer</h2>
        <p>
          Resume Optimizer is a tool designed to help job seekers improve their resumes and increase their chances of
          landing interviews.
        </p>
      </main>
      <Footer />
    </div>
  )
}
