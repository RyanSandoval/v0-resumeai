import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    templates: [
      {
        id: 1,
        name: "Professional",
        description: "A clean, professional template suitable for most industries",
        thumbnail: "/templates/professional-thumb.png",
      },
      {
        id: 2,
        name: "Creative",
        description: "A modern, creative template for design and creative roles",
        thumbnail: "/templates/creative-thumb.png",
      },
      {
        id: 3,
        name: "Executive",
        description: "An elegant template for executive and leadership positions",
        thumbnail: "/templates/executive-thumb.png",
      },
      {
        id: 4,
        name: "Minimal",
        description: "A simple, minimalist template that focuses on content",
        thumbnail: "/templates/minimal-thumb.png",
      },
      {
        id: 5,
        name: "Modern",
        description: "A contemporary template with a sleek design",
        thumbnail: "/templates/modern-thumb.png",
      },
    ],
  })
}
