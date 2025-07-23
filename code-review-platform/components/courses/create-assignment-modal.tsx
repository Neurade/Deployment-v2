"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { assignmentService } from "@/services/assignment.service"
import type { CreateAssignmentRequest } from "@/types/assignment"

interface CreateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  courseId: number
}

export function CreateAssignmentModal({ open, onOpenChange, onSuccess, courseId }: CreateAssignmentModalProps) {
  const [formData, setFormData] = useState<Pick<CreateAssignmentRequest, "assignment_name" | "description">>({
    assignment_name: "",
    description: "",
  })
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.assignment_name.trim()) {
      toast({
        title: "Assignment name is required",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }
    if (!assignmentFile) {
      toast({
        title: "Assignment file is required",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Use FormData to send file and fields
      const data = new FormData()
      data.append("course_id", String(courseId))
      data.append("assignment_name", formData.assignment_name)
      if (formData.description) data.append("description", formData.description)
      data.append("file", assignmentFile)
      console.log(data.get("file"))
      // Use axios directly for multipart/form-data
      await assignmentService.createAssignment(data)

      toast({
        title: "Assignment created successfully!",
        description: `${formData.assignment_name} has been added to the course.`,
      })
      onOpenChange(false)
      setFormData({ assignment_name: "", description: "" })
      setAssignmentFile(null)
      setIsLoading(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Failed to create assignment",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith(".md")) {
      setAssignmentFile(file)
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a .md file",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment_file">Assignment File (.md)</Label>
              <div className="flex items-center gap-2">
                <Input id="assignment_file" type="file" accept=".md" onChange={handleFileChange} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("assignment_file")?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {assignmentFile ? assignmentFile.name : "Choose File"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
