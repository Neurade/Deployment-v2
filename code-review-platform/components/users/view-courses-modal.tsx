"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/types/user"
import type { Course } from "@/types/course"

interface ViewCoursesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  courses: Course[]
}

export function ViewCoursesModal({ open, onOpenChange, user, courses }: ViewCoursesModalProps) {
  const getCourseNames = (courseIds: number[]) => {
    return courses.filter((course) => courseIds.includes(course.id)).map((course) => course.course_name)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assigned Courses - {user?.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {user && getCourseNames(user.assigned_courses || []).length > 0 ? (
            getCourseNames(user.assigned_courses || []).map((courseName, index) => (
              <Badge key={index} variant="outline" className="mr-2 mb-2">
                {courseName}
              </Badge>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No courses assigned</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}