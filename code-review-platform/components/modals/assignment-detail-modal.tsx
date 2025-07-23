"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Calendar, Download, Eye, Clock, Target } from "lucide-react"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import type { AssignmentWithFile } from "@/lib/types"

interface AssignmentDetailModalProps {
  assignment: AssignmentWithFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignmentDetailModal({ assignment, open, onOpenChange }: AssignmentDetailModalProps) {
  const [viewingContent, setViewingContent] = useState(false)
  const [markdownContent, setMarkdownContent] = useState("")

  if (!assignment) return null

  const fetchAndViewContent = async () => {
    setViewingContent(true)
    try {
      // Simulate fetching markdown content
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMarkdownContent(`# ${assignment.name}

## Assignment Overview
${assignment.description}

## Instructions
${assignment.instructions}

## Grading Criteria
- Code quality and organization (30%)
- Functionality and correctness (40%)
- Documentation and comments (20%)
- Best practices implementation (10%)

## Submission Guidelines
1. Create a pull request with your solution
2. Ensure all tests pass
3. Include proper documentation
4. Follow coding standards

## Resources
- [MDN Web Docs](https://developer.mozilla.org)
- [W3Schools](https://www.w3schools.com)
- Course materials and examples
`)
    } catch (error) {
      console.error("Failed to fetch content:", error)
    } finally {
      setViewingContent(false)
    }
  }

  const downloadFile = async () => {
    // Simulate file download
    const element = document.createElement("a")
    const file = new Blob([markdownContent || "Assignment content"], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = assignment.answerKey.fileName
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="h-5 w-5" />
            {assignment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Info */}
          <Card className="border-blue-100">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Created:</span>
                    <span className="text-sm text-gray-600">{new Date(assignment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {assignment.dueDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Due Date:</span>
                      <span className="text-sm text-gray-600">{new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Max Score:</span>
                    <span className="text-sm text-gray-600">{assignment.maxScore} points</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={assignment.isActive ? "default" : "secondary"} className="ml-2">
                      {assignment.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Answer Key:</span>
                    <span className="text-sm text-gray-600 ml-2">{assignment.answerKey.fileName}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{assignment.description}</p>
            </div>
          </div>

          {/* Instructions */}
          {assignment.instructions && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-700">{assignment.instructions}</p>
              </div>
            </div>
          )}

          {/* Answer Key Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Answer Key</h3>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={fetchAndViewContent}
                disabled={viewingContent}
                className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                {viewingContent ? <LoadingSpinner size="sm" /> : <Eye className="h-4 w-4" />}
                View Content
              </Button>
              <Button
                variant="outline"
                onClick={downloadFile}
                className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Content Preview */}
          {markdownContent && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Preview</h3>
              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{markdownContent}</pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Edit Assignment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
