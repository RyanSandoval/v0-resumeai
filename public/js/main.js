document.addEventListener("DOMContentLoaded", () => {
  // Declare gtag as a global function if it's not already defined
  if (typeof gtag === "undefined") {
    window.gtag = () => {
      console.log("gtag function called with arguments:", arguments)
    }
  }

  // Track page views
  console.log("Page loaded: " + window.location.pathname)
  if (typeof gtag === "function") {
    gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
    })
  }

  // Handle notify form submission
  const notifyForm = document.getElementById("notifyForm")
  const notifySuccess = document.getElementById("notifySuccess")

  if (notifyForm) {
    notifyForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // In a real application, you would send this to a server
      // For now, we'll just show the success message
      const email = document.getElementById("notifyEmail").value
      console.log("Notification requested for: " + email)

      // Show success message
      notifyForm.style.display = "none"
      notifySuccess.classList.remove("hidden")

      // Track the event
      if (typeof gtag === "function") {
        gtag("event", "notify_signup", {
          event_category: "engagement",
          event_label: "notify_form",
        })
      }
    })
  }

  // Add active class to current navigation item
  const currentPath = window.location.pathname
  const navLinks = document.querySelectorAll("nav ul li a")

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href")
    if (currentPath.endsWith(linkPath)) {
      link.classList.add("active")
    }
  })

  // Mobile navigation toggle
  const mobileMenuButton = document.getElementById("mobileMenuButton")
  const mobileMenu = document.getElementById("mobileMenu")

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenu.classList.toggle("active")
      mobileMenuButton.classList.toggle("active")

      // Track event
      if (typeof gtag === "function") {
        gtag("event", "mobile_menu_toggle", {
          event_category: "engagement",
          event_label: mobileMenu.classList.contains("active") ? "open" : "close",
        })
      }
    })
  }

  // Track outbound links
  document.querySelectorAll("a").forEach((link) => {
    if (link.hostname !== window.location.hostname) {
      link.addEventListener("click", () => {
        if (typeof gtag === "function") {
          gtag("event", "outbound_link", {
            event_category: "engagement",
            event_label: link.href,
          })
        }
      })
    }
  })

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })

        // Track event
        if (typeof gtag === "function") {
          gtag("event", "anchor_click", {
            event_category: "engagement",
            event_label: targetId,
          })
        }
      }
    })
  })
})
