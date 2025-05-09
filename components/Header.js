import Link from "next/link"
import styles from "../styles/Header.module.css"

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">
          <a>Resume Optimizer</a>
        </Link>
      </div>
      <nav className={styles.nav}>
        <Link href="/">
          <a className={styles.navLink}>Home</a>
        </Link>
        <Link href="/features">
          <a className={styles.navLink}>Features</a>
        </Link>
        <Link href="/about">
          <a className={styles.navLink}>About</a>
        </Link>
        <Link href="/contact">
          <a className={styles.navLink}>Contact</a>
        </Link>
      </nav>
    </header>
  )
}
