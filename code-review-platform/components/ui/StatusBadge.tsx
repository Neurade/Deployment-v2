import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "open" | "merged" | "closed" | "draft" | "graded" | "pending" | "failed" | "not_graded"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    open: "bg-blue-100 text-blue-800",
    merged: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
    draft: "bg-yellow-100 text-yellow-800",
    graded: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    not_graded: "bg-gray-100 text-gray-800",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusConfig[status],
        className,
      )}
    >
      {status.replace("_", " ").toUpperCase()}
    </span>
  )
}
