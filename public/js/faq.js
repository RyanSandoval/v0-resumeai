document.addEventListener("DOMContentLoaded", () => {
  // FAQ toggle functionality
  const faqItems = document.querySelectorAll(".faq-item")

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question")

    question.addEventListener("click", () => {
      // Toggle active class on the clicked item
      item.classList.toggle("active")

      // Close other items
      faqItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains("active")) {
          otherItem.classList.remove("active")
        }
      })

      // Track event
      if (typeof gtag === "function") {
        gtag("event", "faq_toggle", {
          event_category: "engagement",
          event_label: question.querySelector("h4").textContent,
        })
      }
    })
  })

  // Open FAQ items from URL hash
  if (window.location.hash) {
    const hash = window.location.hash.substring(1)
    const targetQuestion = document.querySelector(`[data-question="${hash}"]`)

    if (targetQuestion) {
      const targetItem = targetQuestion.closest(".faq-item")
      targetItem.classList.add("active")

      // Scroll to the item
      setTimeout(() => {
        targetItem.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
  }
})
