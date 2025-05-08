// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get Started button functionality
  const getStartedBtn = document.getElementById("getStarted")
  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", () => {
      alert("Welcome to Resume Optimizer! This feature will be available soon.")
    })
  }

  // Contact form functionality
  const contactForm = document.getElementById("contactForm")
  const formSuccess = document.getElementById("formSuccess")

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Get form values
      const name = document.getElementById("name").value
      const email = document.getElementById("email").value
      const message = document.getElementById("message").value

      // Simple validation
      if (!name || !email || !message) {
        alert("Please fill out all fields")
        return
      }

      // In a real application, you would send this data to a server
      console.log("Form submitted:", { name, email, message })

      // Show success message
      contactForm.style.display = "none"
      formSuccess.style.display = "block"
    })
  }

  // Add animation to feature cards
  const featureCards = document.querySelectorAll(".feature-card")
  featureCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-10px)"
      this.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)"
    })

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)"
      this.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)"
    })
  })
})
