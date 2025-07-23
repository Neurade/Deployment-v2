"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useCourses } from "@/hooks/use-courses"
import { Sidebar } from "@/components/layout/sidebar"
import { CreateCourseModal } from "@/components/courses/create-course-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Calendar, ExternalLink, ClipboardList, GitPullRequest, CheckCircle2 } from "lucide-react"
import type { CreateCourseRequest } from "@/types/course"
import type { Assignment } from "@/types/assignment"
import type { PullRequest } from "@/types/pull-request"
import { assignmentService } from "@/services/assignment.service"
import { pullRequestService } from "@/services/pull-request.service"

export default function CoursesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const userId = user?.id ?? 0
  const { courses, loading, createCourse } = useCourses(userId, !isAdmin) // !isAdmin means assignedOnly=false for admin
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Store assignment and PR counts per course
  const [courseStats, setCourseStats] = useState<Record<number, {
    assignments: Assignment[],
    pullRequests: PullRequest[]
  }>>({})

  useEffect(() => {
    if (courses.length === 0) return
    // Fetch assignments and PRs for each course
    courses.forEach(async (course) => {
      const [assignments, pullRequests] = await Promise.all([
        assignmentService.getAssignmentsByCourse(course.id),
        pullRequestService.getPullRequestsByCourse(course.id)
      ])
      setCourseStats(prev => ({
        ...prev,
        [course.id]: { assignments, pullRequests }
      }))
    })
  }, [courses])
  // console.log("prs", courseStats);

  const handleCreateCourse = async (data: CreateCourseRequest & { generalAnswerFile?: File }) => {
    await createCourse(data)
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </main>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isAdmin ? "Course Management" : "My Assigned Courses"}
              </h1>
              <p className="text-gray-600 mt-2">
                {isAdmin ? "Manage all courses and assignments" : "View courses assigned to you"}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {isAdmin ? "No courses created yet" : "No courses assigned to you"}
              </h3>
              <p className="text-gray-600 mb-6">
                {isAdmin 
                  ? "Create your first course to get started" 
                  : "Contact your administrator to assign courses to you"
                }
              </p>
              {isAdmin && (
                <Button onClick={() => setShowCreateModal(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Course
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {courses.map((course) => {
                const stats = courseStats[course.id] || { assignments: [], pullRequests: [] }
                const assignmentCount = stats.assignments.length
                const prCount = stats.pullRequests.length
                const gradedCount = stats.pullRequests.filter(pr => pr.status_grade === "Done").length

                return (
                  <Card
                    key={course.id}
                    className="hover:shadow-xl transition-all duration-200 cursor-pointer border-0 shadow-md h-full flex flex-col min-h-[220px]"
                  >
             <CardHeader className="pb-2">
  <div className="flex justify-between items-start gap-3">
    <CardTitle
      className="text-lg font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[3.2rem]" // roughly 2 lines
      title={course.course_name}
    >
      {course.course_name}
    </CardTitle>
  </div>
</CardHeader>


                    <CardContent className="pt-0 flex flex-col justify-between flex-1">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 shrink-0" />
                            <span>{new Date(course.created_at).toLocaleDateString("en-US")}</span>
                          </div>
                          <Badge
                            variant={course.auto_grade ? "default" : "secondary"}
                            className="text-xs shrink-0"
                          >
                            {course.auto_grade ? "Auto" : "Manual"}
                          </Badge>
                        </div>

                        {course.github_url && (
                          <div className="flex items-center text-sm text-blue-600 group">
                            <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
                            <span
                              className="truncate group-hover:text-blue-800 transition-colors"
                              title={`${course.owner}/${course.repo_name}`}
                            >
                              {course.owner}/{course.repo_name}
                            </span>
                          </div>
                        )}

                        {/* Additional Info Section */}
                        <div className="flex justify-between items-center mt-2 gap-2">
                          <div className="flex items-center gap-1 text-gray-700">
                            <ClipboardList className="h-5 w-5 text-indigo-500" />
                            <span className="font-medium">{assignmentCount}</span>
                            <span className="text-xs text-gray-500">Ass</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-700">
                            <GitPullRequest className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">{prCount}</span>
                            <span className="text-xs text-gray-500">PRs</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-700">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="font-medium">{gradedCount}</span>
                            <span className="text-xs text-gray-500">Graded</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
<Button
  onClick={() => router.push(`/courses/${course.id}`)}
  variant="outline"
  className="w-full text-sm font-sans font-medium bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 hover:text-black transition-all rounded-lg"
>
  View Details
</Button>

                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {isAdmin && (
        <CreateCourseModal 
          open={showCreateModal} 
          onOpenChange={setShowCreateModal} 
          onSubmit={handleCreateCourse} 
        />
      )}
    </div>
  )
}