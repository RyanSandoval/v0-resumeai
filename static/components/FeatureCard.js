"use client"

import React from "react"

// FeatureCard.js - React component for feature cards
const FeatureCard = ({ title, description }) => {
  const [isHovered, setIsHovered] = React.useState(false)

  const cardStyle = {
    transform: isHovered ? "translateY(-10px)" : "translateY(0)",
    boxShadow: isHovered ? "0 10px 20px rgba(0,0,0,0.1)" : "0 2px 5px rgba(0,0,0,0.05)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  }

  return (
    <div
      className="feature-card"
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

// App.js - Renders multiple feature cards
const FeatureCards = () => {
  const features = [
    {
      title: "AI Analysis",
      description: "Our AI analyzes your resume against job descriptions to find the perfect match.",
    },
    {
      title: "Keyword Optimization",
      description: "Identify and add missing keywords to increase your chances of getting past ATS systems.",
    },
    {
      title: "Format Suggestions",
      description: "Get suggestions to improve the format and readability of your resume.",
    },
    {
      title: "Real-time Feedback",
      description: "Receive instant feedback as you make changes to your resume.",
    },
  ]

  return (
    <div className="feature-grid">
      {features.map((feature, index) => (
        <FeatureCard key={index} title={feature.title} description={feature.description} />
      ))}
    </div>
  )
}

// Render the FeatureCards component
const ReactDOM = require("react-dom")
ReactDOM.render(<FeatureCards />, document.getElementById("feature-cards"))
