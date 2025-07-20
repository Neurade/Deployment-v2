import React, { useId } from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  id?: string // Allow custom ID but make it optional
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id: providedId, ...props }, ref) => {
    const generatedId = useId() // Create stable IDs across renders
    const id = providedId || `input-${generatedId}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            error && "border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = "Input"
