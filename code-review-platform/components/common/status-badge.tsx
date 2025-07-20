import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "open" | "merged" | "closed" | "draft"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    open: {
      variant: "default" as const,
      className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      label: "Open",
    },
    merged: {
      variant: "default" as const,
      className: "bg-green-100 text-green-800 hover:bg-green-200",
      label: "Merged",
    },
    closed: {
      variant: "secondary" as const,
      className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      label: "Closed",
    },
    draft: {
      variant: "outline" as const,
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      label: "Draft",
    },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
