"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push(`/${user.id}/course`)
    } else if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // This will only render if user exists but we're still on /dashboard
  // In practice, the useEffect above should redirect before this renders
  if (user) {
    return (
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    )
  }

  return null
} 