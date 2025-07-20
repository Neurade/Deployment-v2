"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./Button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Modal({ isOpen, onClose, title, children, size = "md", className }: ModalProps) {
  if (!isOpen) return null

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className={cn("relative w-full bg-white rounded-lg shadow-xl", sizes[size], className)}>
          {title && (
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
