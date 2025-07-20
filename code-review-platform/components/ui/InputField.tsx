import type React from "react"
import { cn } from "@/lib/utils"

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function InputField({ label, error, helperText, className, ...props }: InputFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  )
}
