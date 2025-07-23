"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Sidebar } from "@/components/layout/sidebar"
import { CourseList } from "@/components/courses/course-list"
import { useCourses } from "@/hooks/use-courses"

export default function DashboardPage() {
  const { isAuthenticated, loading } = useAuth()
  const { user, loading: authLoading } = useAuth()
  useEffect(() => {
    if (!authLoading && user) {
      console.log("userId:", user.id);
    }
  }, [authLoading, user]);
  const userId = user?.id ?? 0
  const { courses, loading: coursesLoading } = useCourses(userId)
  console.log(coursesLoading);

  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <CourseList />
        </div>
      </main>
    </div>
  )
}
