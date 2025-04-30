"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

interface ImageLightboxProps {
  src: string
  alt: string
  onClose: () => void
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  // Log the image source for debugging
  useEffect(() => {
    console.log("Lightbox image source:", src)
  }, [src])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <button className="absolute -right-4 -top-4 rounded-full bg-red-500 p-1 text-white" onClick={onClose}>
          <X className="h-6 w-6" />
        </button>
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
          onError={(e) => {
            console.error("Lightbox image failed to load:", src)
            ;(e.target as HTMLImageElement).src = "/placeholder.svg"
          }}
        />
      </div>
    </div>
  )
}
