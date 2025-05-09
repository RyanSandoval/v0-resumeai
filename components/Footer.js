import styles from "../styles/Footer.module.css"

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.copyright}>© {new Date().getFullYear()} Resume Optimizer. All rights reserved.</div>
        <div className={styles.links}>
          <a href="#" className={styles.link}>
            Privacy Policy
          </a>
          <a href="#" className={styles.link}>
            Terms of Service
          </a>
          <a href="#" className={styles.link}>
            Sitemap
          </a>
        </div>
      </div>
    </footer>
  )
}
