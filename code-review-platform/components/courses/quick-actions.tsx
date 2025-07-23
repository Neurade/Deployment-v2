"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, FileText, Trash } from "lucide-react"
import { EditCourseModal } from "@/components/courses/edit-course-modal"
import { DeleteConfirmationModal } from "@/components/courses/delete-confirmation-modal"
import { courseService } from "@/services/course.service"
import { useToast } from "@/hooks/use-toast"
import type { Course } from "@/types/course"

interface QuickActionsProps {
  courseId: number
  course: Course
  onRefetch: () => void
  isAdmin: boolean
}

export function QuickActions({ courseId, course, onRefetch, isAdmin }: QuickActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteCourse = async () => {
    try {
      await courseService.deleteCourse(courseId)
      router.push("/courses")
      toast({
        title: "Success",
        description: "Course deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => router.push(`/courses/${courseId}/pull-requests`)}
          >
            <Github className="h-4 w-4 mr-2" />
            View Pull Requests
          </Button>
{isAdmin && (
  <>
    <Button
      variant="outline"
      className="w-full justify-start bg-transparent"
      onClick={() => setShowEditModal(true)}
    >
      <FileText className="h-4 w-4 mr-2" />
      Edit Course
    </Button>

    <Button
      variant="outline"
      className="w-full justify-start text-red-600 hover:text-red-800 hover:bg-red-50 bg-transparent"
      onClick={() => setShowDeleteModal(true)}
    >
      <Trash className="h-4 w-4 mr-2" />
      Delete Course
    </Button>
  </>
)}
        </CardContent>
      </Card>

      <EditCourseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        course={course}
        onSuccess={() => {
          setShowEditModal(false)
          onRefetch()
        }}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        description="Are you sure you want to delete this course? This action cannot be undone. All assignments and associated data will be permanently deleted."
      />
    </>
  )
}
