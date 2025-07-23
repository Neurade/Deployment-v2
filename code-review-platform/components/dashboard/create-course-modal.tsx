"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateCourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCourseModal({ open, onOpenChange }: CreateCourseModalProps) {
  const [formData, setFormData] = useState({
    course_name: "",
    github_url: "",
    auto_grade: false,
  })
  const [generalAnswerFile, setGeneralAnswerFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Course created successfully!",
        description: `${formData.course_name} has been added to your courses.`,
      })
      onOpenChange(false)
      setFormData({ course_name: "", github_url: "", auto_grade: false })
      setGeneralAnswerFile(null)
      setIsLoading(false)
    }, 1000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith(".md")) {
      setGeneralAnswerFile(file)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course_name">Course Name</Label>
              <Input
                id="course_name"
                placeholder="Enter course name"
                value={formData.course_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, course_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                type="url"
                placeholder="https://github.com/username/repo"
                value={formData.github_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, github_url: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="general_answer">Coding Convention File (.md)</Label>
              <div className="flex items-center gap-2">
                <Input id="general_answer" type="file" accept=".md" onChange={handleFileChange} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("general_answer")?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {generalAnswerFile ? generalAnswerFile.name : "Choose File"}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto_grade"
                checked={formData.auto_grade}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, auto_grade: checked as boolean }))}
              />
              <Label htmlFor="auto_grade">Enable Auto Grade</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
