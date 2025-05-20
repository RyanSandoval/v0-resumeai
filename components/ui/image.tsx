"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackSrc?: string
  priority?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width = 500,
  height = 300,
  className = "",
  fallbackSrc = "/placeholder.svg",
  priority = false,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Reset states when src changes
    setImgSrc(src)
    setLoading(true)
    setError(false)
  }, [src])

  const handleError = () => {
    setError(true)
    setImgSrc(fallbackSrc)
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {loading && !error && <Skeleton className="absolute inset-0 z-10" />}
      <Image
        src={imgSrc || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoad={() => setLoading(false)}
        onError={handleError}
        priority={priority}
      />
    </div>
  )
}
