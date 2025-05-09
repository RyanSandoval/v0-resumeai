import Head from "next/head"
import Header from "./Header"
import Footer from "./Footer"
import styles from "../styles/Layout.module.css"

export default function Layout({ children, title, description }) {
  return (
    <div className={styles.container}>
      <Head>
        <title>{title || "Resume Optimizer"}</title>
        <meta name="description" content={description || "Optimize your resume for job applications"} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className={styles.main}>{children}</main>

      <Footer />
    </div>
  )
}
