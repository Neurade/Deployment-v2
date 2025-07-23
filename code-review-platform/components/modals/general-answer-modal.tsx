"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Eye } from "lucide-react"
import { LoadingSpinner } from "@/components/common/loading-spinner"

interface GeneralAnswerModalProps {
  generalAnswer: {
    url: string
    fileName: string
    expiresIn: string
  }
  courseName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GeneralAnswerModal({ generalAnswer, courseName, open, onOpenChange }: GeneralAnswerModalProps) {
  const [viewingContent, setViewingContent] = useState(false)
  const [markdownContent, setMarkdownContent] = useState("")

  const fetchAndViewContent = async () => {
    setViewingContent(true)
    try {
      // Simulate fetching markdown content
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMarkdownContent(`# ${courseName} - General Guidelines

## Course Overview
This document contains general guidelines and best practices for all assignments in this course.

## Coding Standards
- Use consistent indentation (2 or 4 spaces)
- Write meaningful variable and function names
- Add comments for complex logic
- Follow language-specific conventions

## Submission Requirements
1. **Code Quality**: Your code should be clean, readable, and well-organized
2. **Documentation**: Include README files and inline comments
3. **Testing**: Write and run tests for your code
4. **Version Control**: Use meaningful commit messages

## Grading Criteria
- **Functionality (40%)**: Does the code work as expected?
- **Code Quality (30%)**: Is the code clean and well-structured?
- **Documentation (20%)**: Are there adequate comments and documentation?
- **Best Practices (10%)**: Does the code follow industry standards?

## Common Mistakes to Avoid
- Hardcoding values that should be configurable
- Not handling edge cases or errors
- Poor variable naming
- Lack of code organization
- Missing documentation

## Resources
- Course materials and lecture notes
- Official documentation for languages/frameworks
- Stack Overflow for troubleshooting
- Office hours for additional help

## Academic Integrity
- All work must be your own
- Collaboration is allowed but must be documented
- Cite any external resources used
- Do not share solutions with other students

## Getting Help
If you need assistance:
1. Review the course materials
2. Check the FAQ section
3. Attend office hours
4. Post questions in the course forum
5. Contact the instructor directly

Remember: The goal is to learn and understand the concepts, not just complete the assignments.
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
    const file = new Blob([markdownContent || "General guidelines content"], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = generalAnswer.fileName
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
            General Guidelines - {courseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Info */}
          <Card className="border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{generalAnswer.fileName}</h3>
                    <p className="text-sm text-gray-600">General course guidelines and best practices</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAndViewContent}
                    disabled={viewingContent}
                    className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    {viewingContent ? <LoadingSpinner size="sm" /> : <Eye className="h-4 w-4" />}
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadFile}
                    className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Preview */}
          {markdownContent && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Preview</h3>
              <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{markdownContent}</pre>
              </div>
            </div>
          )}

          {!markdownContent && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Click "View" to preview the general guidelines content</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
