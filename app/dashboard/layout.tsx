import type React from "react"
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ display: "flex" }}>
        <div style={{ width: "200px", padding: "20px", background: "#f0f0f0" }}>
          <h3>Dashboard Menu</h3>
          <ul>
            <li>Overview</li>
            <li>Resumes</li>
            <li>Settings</li>
          </ul>
        </div>
        <div style={{ flex: 1, padding: "20px" }}>{children}</div>
      </div>
    </div>
  )
}
