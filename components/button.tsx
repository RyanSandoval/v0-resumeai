import type React from "react"
export default function Button({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        backgroundColor: "#0070f3",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  )
}
