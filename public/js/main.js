document.addEventListener("DOMContentLoaded", () => {
  // Declare gtag as a global function if it's not already defined
  if (typeof gtag === "undefined") {
    window.gtag = () => {
      console.log("gtag function called with arguments:", arguments)
    }
  }

  // Track page views
  console.log("Page loaded: " + window.location.pathname)

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
})
