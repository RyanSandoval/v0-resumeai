"use client"

import React from "react"

// FeatureItem.js - React component for feature items
const FeatureItem = ({ title, description }) => {
  const [isHovered, setIsHovered] = React.useState(false)

  const itemStyle = {
    transform: isHovered ? "translateX(5px)" : "translateX(0)",
    transition: "transform 0.3s ease",
  }

  return (
    <div
      className="feature-item"
      style={itemStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

// FeaturesList.js - Renders multiple feature items
const FeaturesList = () => {
  const features = [
    {
      title: "AI Resume Analysis",
      description:
        "Our advanced AI analyzes your resume against job descriptions to identify strengths and weaknesses. It provides a comprehensive report with actionable suggestions to improve your resume's effectiveness.",
    },
    {
      title: "Keyword Optimization",
      description:
        "Most companies use Applicant Tracking Systems (ATS) to filter resumes. Our tool identifies important keywords from job descriptions and suggests how to incorporate them into your resume to increase your chances of getting past these systems.",
    },
    {
      title: "Format Suggestions",
      description:
        "The format and structure of your resume matter. Our tool provides suggestions to improve readability, organization, and visual appeal of your resume.",
    },
    {
      title: "Real-time Feedback",
      description:
        "As you make changes to your resume, our tool provides real-time feedback, allowing you to see how your changes impact your resume's effectiveness.",
    },
    {
      title: "Multiple Templates",
      description:
        "Choose from a variety of professional templates designed to impress employers in different industries.",
    },
    {
      title: "Job Tracking",
      description:
        "Keep track of the jobs you've applied to and the versions of your resume you've used for each application.",
    },
  ]

  return (
    <section className="features-page">
      <h1>Our Features</h1>

      {features.map((feature, index) => (
        <FeatureItem key={index} title={feature.title} description={feature.description} />
      ))}
    </section>
  )
}

// Render the FeaturesList component
const ReactDOM = require("react-dom")
ReactDOM.render(<FeaturesList />, document.getElementById("features-list"))
