"use client"

import React from "react"

// TeamMember.js - React component for team members
const TeamMember = ({ name, role }) => {
  const [isHovered, setIsHovered] = React.useState(false)

  const memberStyle = {
    transform: isHovered ? "translateY(-5px)" : "translateY(0)",
    boxShadow: isHovered ? "0 5px 15px rgba(0,0,0,0.1)" : "0 2px 5px rgba(0,0,0,0.05)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  }

  return (
    <div
      className="team-member"
      style={memberStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3>{name}</h3>
      <p>{role}</p>
    </div>
  )
}

// AboutSection.js - Renders the about section with team members
const AboutSection = () => {
  const teamMembers = [
    { name: "Jane Doe", role: "Founder & CEO" },
    { name: "John Smith", role: "CTO" },
    { name: "Emily Johnson", role: "Head of HR" },
    { name: "Michael Brown", role: "AI Lead" },
  ]

  return (
    <section className="about">
      <h1>About Resume Optimizer</h1>
      <p>
        Resume Optimizer was founded with a simple mission: to help job seekers create the best possible resume for
        their target positions.
      </p>
      <p>
        Our team of HR professionals and AI experts have combined their knowledge to create a tool that analyzes resumes
        against job descriptions and provides actionable feedback.
      </p>

      <h2>Our Team</h2>
      <div className="team-grid">
        {teamMembers.map((member, index) => (
          <TeamMember key={index} name={member.name} role={member.role} />
        ))}
      </div>
    </section>
  )
}

// Render the AboutSection component
const ReactDOM = require("react-dom")
ReactDOM.render(<AboutSection />, document.getElementById("about-section"))
