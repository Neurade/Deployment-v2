"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { courseService } from "@/services/course.service"
import { userService } from "@/services/user.service" // Add this import
import type { User } from "@/types/user"
import type { Course } from "@/types/course"

interface AssignCoursesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  courses: Course[]
  getUnassignedCourses: (user: User) => Course[]
  onAssignComplete: () => void
}

export function AssignCoursesModal({ 
  open, 
  onOpenChange, 
  user, 
  courses, 
  getUnassignedCourses, 
  onAssignComplete
}: AssignCoursesModalProps) {
  const [selectedCourses, setSelectedCourses] = useState<number[]>([])
  const [initialAssignedCourses, setInitialAssignedCourses] = useState<number[]>([])
  const [assigning, setAssigning] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Initialize selected courses when modal opens or user changes
  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!user || !open) return
      
      setLoading(true)
      try {
        // Fetch the most up-to-date user course assignments
        const userCourses = await courseService.getCoursesByPermission(user.id)
        const assignedCourseIds = userCourses.map(course => course.id)
        
        setSelectedCourses([...assignedCourseIds])
        setInitialAssignedCourses([...assignedCourseIds])
      } catch (error) {
        // Fallback to the user data passed as prop
        console.log("Failed to fetch fresh course data, using cached data")
        const assigned = user.assigned_courses || []
        setSelectedCourses([...assigned])
        setInitialAssignedCourses([...assigned])
      } finally {
        setLoading(false)
      }
    }

    fetchUserCourses()
  }, [user, open])

  const handleCourseSelection = (courseId: number, checked: boolean) => {
    if (checked) {
      setSelectedCourses(prev => [...prev, courseId])
    } else {
      setSelectedCourses(prev => prev.filter(id => id !== courseId))
    }
  }

  const handleSaveChanges = async () => {
    if (!user) return
    
    setAssigning(true)
    
    try {
      // Use the UpdateUserCoursePermissions endpoint
      await courseService.updateUserCoursePermissions(user.id, selectedCourses)

      const assignedCount = selectedCourses.filter(courseId => !initialAssignedCourses.includes(courseId)).length
      const revokedCount = initialAssignedCourses.filter(courseId => !selectedCourses.includes(courseId)).length

      let description = ""
      if (assignedCount > 0 && revokedCount > 0) {
        description = `Assigned ${assignedCount} course${assignedCount !== 1 ? 's' : ''} and revoked ${revokedCount} course${revokedCount !== 1 ? 's' : ''}`
      } else if (assignedCount > 0) {
        description = `Successfully assigned ${assignedCount} course${assignedCount !== 1 ? 's' : ''}`
      } else if (revokedCount > 0) {
        description = `Successfully revoked ${revokedCount} course${revokedCount !== 1 ? 's' : ''}`
      } else {
        description = `Updated course permissions (${selectedCourses.length} courses assigned)`
      }

      toast({
        title: "Success",
        description: `${description} for ${user.email}`,
        duration: 3000,
      })
      
      onAssignComplete()
    } catch (error: any) {
      console.error("Error updating course assignments:", error)
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update course assignments. Please try again.",
        duration: 4000,
      })
    } finally {
      setAssigning(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset selections when closing
      setSelectedCourses([])
      setInitialAssignedCourses([])
    }
    onOpenChange(newOpen)
  }

  const hasChanges = () => {
    if (selectedCourses.length !== initialAssignedCourses.length) return true
    return !selectedCourses.every(courseId => initialAssignedCourses.includes(courseId))
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Course Assignments</DialogTitle>
          <DialogDescription>
            Assign or revoke courses for {user.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-500">Loading current assignments...</span>
            </div>
          ) : (
            <>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {courses.length > 0 ? (
                  courses.map((course) => {
                    const isCurrentlyAssigned = initialAssignedCourses.includes(course.id)
                    const isSelected = selectedCourses.includes(course.id)
                    
                    return (
                      <div 
                        key={course.id} 
                        className={`flex items-center space-x-2 p-3 rounded border ${
                          isCurrentlyAssigned ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCourseSelection(course.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`course-${course.id}`}
                            className="text-sm font-medium leading-none cursor-pointer block"
                          >
                            {course.course_name}
                          </label>
                          
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No courses available.</p>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-600 space-y-1">
                <div>Selected: {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''}</div>
                <div>Originally assigned: {initialAssignedCourses.length} course{initialAssignedCourses.length !== 1 ? 's' : ''}</div>
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={assigning || loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              disabled={!hasChanges() || assigning || loading}
            >
              {assigning ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}