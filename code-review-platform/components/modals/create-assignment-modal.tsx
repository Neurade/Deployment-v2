"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useCourseDetail } from "@/hooks/use-course-detail"
import type { AssignmentCreateRequest } from "@/types"

interface CreateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: number
}

export function CreateAssignmentModal({ open, onOpenChange, courseId }: CreateAssignmentModalProps) {
  const [formData, setFormData] = useState({
    assignment_name: "",
    description: "",
    assignment_url: "",
  })
  const [loading, setLoading] = useState(false)
  const { createAssignment } = useCourseDetail(courseId)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.assignment_name.trim()) {
      toast({
        title: "Assignment name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const now = new Date().toISOString()
      const assignmentData: AssignmentCreateRequest = {
        course_id: courseId,
        assignment_name: formData.assignment_name,
        description: formData.description,
        assignment_url: formData.assignment_url,
        created_at: now,
        updated_at: now,
      }

      await createAssignment(assignmentData)

      toast({
        title: "Assignment created successfully!",
        description: `${formData.assignment_name} has been added to the course.`,
      })

      onOpenChange(false)
      setFormData({ assignment_name: "", description: "", assignment_url: "" })
    } catch (error: any) {
      toast({
        title: "Failed to create assignment",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assignment_name">Assignment Name</Label>
              <Input
                id="assignment_name"
                placeholder="Enter assignment name"
                value={formData.assignment_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, assignment_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter assignment description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment_url">Assignment URL (optional)</Label>
              <Input
                id="assignment_url"
                type="url"
                placeholder="https://example.com/assignment"
                value={formData.assignment_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, assignment_url: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
