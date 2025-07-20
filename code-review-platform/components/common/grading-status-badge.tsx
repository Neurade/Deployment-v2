import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, XCircle, Minus } from "lucide-react"

interface GradingStatusBadgeProps {
  status: "graded" | "pending" | "failed" | "not_graded"
  className?: string
  showIcon?: boolean
}

export function GradingStatusBadge({ status, className, showIcon = true }: GradingStatusBadgeProps) {
  const statusConfig = {
    graded: {
      variant: "default" as const,
      className: "bg-green-100 text-green-800 hover:bg-green-200",
      label: "Graded",
      icon: CheckCircle,
    },
    pending: {
      variant: "default" as const,
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      label: "Pending",
      icon: Clock,
    },
    failed: {
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 hover:bg-red-200",
      label: "Failed",
      icon: XCircle,
    },
    not_graded: {
      variant: "outline" as const,
      className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      label: "Not Graded",
      icon: Minus,
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
