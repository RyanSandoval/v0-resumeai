"use client"

import React from "react"

// ContactForm.js - React component for the contact form
const ContactForm = () => {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [errors, setErrors] = React.useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid"
    if (!formData.message.trim()) newErrors.message = "Message is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      // In a real app, you would send this data to a server
      console.log("Form submitted:", formData)
      setIsSubmitted(true)
    }
  }

  if (isSubmitted) {
    return (
      <div className="form-success">
        <h2>Thank you for your message!</h2>
        <p>We'll get back to you as soon as possible.</p>
      </div>
    )
  }

  return (
    <section className="contact">
      <h1>Contact Us</h1>
      <p>Have questions or feedback? We'd love to hear from you!</p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "error" : ""}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "error" : ""}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            className={errors.message ? "error" : ""}
          ></textarea>
          {errors.message && <span className="error-message">{errors.message}</span>}
        </div>

        <button type="submit" className="btn-primary">
          Send Message
        </button>
      </form>
    </section>
  )
}

// Render the ContactForm component
const root = ReactDOM.createRoot(document.getElementById("contact-form"))
root.render(<ContactForm />)
