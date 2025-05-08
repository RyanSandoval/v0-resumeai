"use client"

// Hero.js - React component for the hero section
import React from "react"
import ReactDOM from "react-dom"

const Hero = () => {
  const [isHovered, setIsHovered] = React.useState(false)

  const handleClick = () => {
    alert("Welcome to Resume Optimizer! This feature will be available soon.")
  }

  const buttonStyle = {
    transform: isHovered ? "scale(1.05)" : "scale(1)",
    transition: "transform 0.3s ease",
  }

  return (
    <section className="hero">
      <h1>Optimize Your Resume</h1>
      <p>Get more interviews with our AI-powered resume optimization tool</p>
      <button
        className="btn-primary"
        style={buttonStyle}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        Get Started
      </button>
    </section>
  )
}

// Render the Hero component
ReactDOM.render(<Hero />, document.getElementById("hero-section"))
