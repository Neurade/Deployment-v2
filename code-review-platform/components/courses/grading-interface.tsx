"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, GitPullRequest, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GradingInterfaceProps {
  pullRequests: any[]
  assignments: any[]
}

export function GradingInterface({ pullRequests, assignments }: GradingInterfaceProps) {
  const [selectedPR, setSelectedPR] = useState("")
  const [selectedAssignment, setSelectedAssignment] = useState("")
  const [isGrading, setIsGrading] = useState(false)
  const { toast } = useToast()

  const handleGrade = async () => {
    if (!selectedPR || !selectedAssignment) {
      toast({
        title: "Selection required",
        description: "Please select both a pull request and an assignment",
        variant: "destructive",
      })
      return
    }

    setIsGrading(true)

    // Simulate grading process
    setTimeout(() => {
      toast({
        title: "Grading completed!",
        description: "The assignment has been automatically evaluated and feedback has been generated.",
      })
      setIsGrading(false)
      setSelectedPR("")
      setSelectedAssignment("")
    }, 3000)
  }

  const selectedPRData = pullRequests.find((pr) => pr.id === selectedPR)
  const selectedAssignmentData = assignments.find((assignment) => assignment.id === selectedAssignment)

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <GraduationCap className="h-5 w-5" />
          Auto-Grading Interface
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pull Request Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Pull Request</label>
            <Select value={selectedPR} onValueChange={setSelectedPR}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a pull request" />
              </SelectTrigger>
              <SelectContent>
                {pullRequests.map((pr) => (
                  <SelectItem key={pr.id} value={pr.id}>
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4" />
                      <span>
                        #{pr.pr_number} - {pr.pr_name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPRData && (
              <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge variant="outline" className="ml-1">
                    {selectedPRData.status}
                  </Badge>
                </p>
                <p className="mt-1">
                  <strong>Description:</strong> {selectedPRData.pr_description}
                </p>
              </div>
            )}
          </div>

          {/* Assignment Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Assignment</label>
            <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{assignment.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAssignmentData && (
              <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                <p>
                  <strong>Assignment:</strong> {selectedAssignmentData.name}
                </p>
                <p className="mt-1">
                  <strong>Description:</strong> {selectedAssignmentData.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Grade Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleGrade}
            disabled={!selectedPR || !selectedAssignment || isGrading}
            className="flex items-center gap-2"
            size="lg"
          >
            <GraduationCap className="h-4 w-4" />
            {isGrading ? "Grading in Progress..." : "Grade Assignment"}
          </Button>
        </div>

        {isGrading && (
          <div className="text-center text-sm text-blue-600">
            <p>🤖 AI is analyzing the code submission...</p>
            <p className="mt-1">This may take a few moments.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
